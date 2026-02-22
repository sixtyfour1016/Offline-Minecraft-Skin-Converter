const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 8787);
const ROOT_DIR = process.cwd();

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.mp3': 'audio/mpeg',
    '.ttf': 'font/ttf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ico': 'image/x-icon'
};

const REQUEST_HEADERS_JSON = {
    Accept: 'application/json',
    'User-Agent': 'Offline-Minecraft-Skin-Converter/1.0'
};

const REQUEST_HEADERS_PNG = {
    Accept: 'image/png',
    'User-Agent': 'Offline-Minecraft-Skin-Converter/1.0'
};

function sendJson(res, statusCode, payload) {
    const body = JSON.stringify(payload);
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(body),
        'Cache-Control': 'no-store'
    });
    res.end(body);
}

function isValidUsername(username) {
    return /^[A-Za-z0-9_]{3,16}$/.test(username);
}

function toUndashedUuid(uuid) {
    return String(uuid || '').replace(/-/g, '').toLowerCase();
}

function normalizeHttpsUrl(url) {
    return String(url || '').trim().replace(/^http:\/\//i, 'https://');
}

function extractSkinUrlFromLookupProfile(profilePayload) {
    const skins = Array.isArray(profilePayload && profilePayload.skins)
        ? profilePayload.skins
        : [];
    const activeSkin = skins.find((skin) => {
        return skin &&
            typeof skin.url === 'string' &&
            skin.url &&
            String(skin.state || '').toUpperCase() === 'ACTIVE';
    });
    const fallbackSkin = skins.find((skin) => skin && typeof skin.url === 'string' && skin.url);
    return normalizeHttpsUrl(activeSkin ? activeSkin.url : fallbackSkin ? fallbackSkin.url : '');
}

async function fetchJson(url) {
    const response = await fetch(url, {
        method: 'GET',
        headers: REQUEST_HEADERS_JSON
    });

    if (response.status === 204 || response.status === 404) {
        return { kind: 'not-found', data: null };
    }
    if (!response.ok) {
        return { kind: 'error', status: response.status, data: null };
    }

    const data = await response.json();
    return { kind: 'ok', data };
}

async function resolveUuid(username) {
    const encoded = encodeURIComponent(username);
    const lookupOrder = [
        `https://api.minecraftservices.com/minecraft/profile/lookup/name/${encoded}`,
        `https://api.mojang.com/users/profiles/minecraft/${encoded}`
    ];
    let sawUpstreamError = false;

    for (const endpoint of lookupOrder) {
        try {
            const result = await fetchJson(endpoint);
            if (result.kind === 'ok' && result.data && result.data.id) {
                const skinUrl = endpoint.includes('api.minecraftservices.com')
                    ? extractSkinUrlFromLookupProfile(result.data)
                    : '';
                return { kind: 'ok', uuid: result.data.id, skinUrl };
            }
            if (result.kind === 'not-found') {
                continue;
            }
            sawUpstreamError = true;
        } catch (error) {
            return { kind: 'network' };
        }
    }

    return sawUpstreamError ? { kind: 'upstream' } : { kind: 'not-found' };
}

function extractSkinUrl(profilePayload) {
    const properties = Array.isArray(profilePayload && profilePayload.properties)
        ? profilePayload.properties
        : [];
    const texturesProp = properties.find((item) => item && item.name === 'textures');
    if (!texturesProp || !texturesProp.value) {
        return '';
    }

    const decoded = Buffer.from(String(texturesProp.value), 'base64').toString('utf8');
    const parsed = JSON.parse(decoded);
    const rawUrl = parsed && parsed.textures && parsed.textures.SKIN
        ? parsed.textures.SKIN.url
        : '';
    return normalizeHttpsUrl(rawUrl);
}

async function fetchSkinImage(skinUrl) {
    const normalizedUrl = normalizeHttpsUrl(skinUrl);
    if (!normalizedUrl) {
        return { kind: 'upstream' };
    }

    try {
        const response = await fetch(normalizedUrl, {
            method: 'GET',
            headers: REQUEST_HEADERS_PNG
        });
        if (!response.ok) {
            return { kind: 'upstream' };
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        if (!buffer.length) {
            return { kind: 'upstream' };
        }
        return { kind: 'ok', buffer };
    } catch (error) {
        return { kind: 'network' };
    }
}

async function fetchSkinPng(username) {
    const uuidResult = await resolveUuid(username);
    if (uuidResult.kind === 'not-found') {
        return { kind: 'not-found' };
    }
    if (uuidResult.kind === 'network') {
        return { kind: 'network' };
    }
    if (uuidResult.kind !== 'ok') {
        return { kind: 'upstream' };
    }

    if (uuidResult.skinUrl) {
        const directSkinResult = await fetchSkinImage(uuidResult.skinUrl);
        if (directSkinResult.kind === 'ok' || directSkinResult.kind === 'network') {
            return directSkinResult;
        }
    }

    const sessionUrl = `https://sessionserver.mojang.com/session/minecraft/profile/${toUndashedUuid(uuidResult.uuid)}`;
    const sessionResult = await fetchJson(sessionUrl);
    if (sessionResult.kind === 'not-found') {
        return { kind: 'not-found' };
    }
    if (sessionResult.kind !== 'ok') {
        return { kind: 'upstream' };
    }

    let skinUrl = '';
    try {
        skinUrl = extractSkinUrl(sessionResult.data);
    } catch (error) {
        return { kind: 'upstream' };
    }
    if (!skinUrl) {
        return { kind: 'upstream' };
    }

    return fetchSkinImage(skinUrl);
}

function sendStaticFile(req, res, requestPath) {
    const normalizedPath = requestPath === '/'
        ? 'index.html'
        : requestPath.replace(/^\/+/, '');
    const resolvedPath = path.resolve(ROOT_DIR, normalizedPath);

    if (!resolvedPath.startsWith(ROOT_DIR)) {
        sendJson(res, 403, { code: 'forbidden', message: 'Forbidden' });
        return;
    }

    fs.readFile(resolvedPath, (error, data) => {
        if (error) {
            if (error.code === 'ENOENT') {
                sendJson(res, 404, { code: 'not_found', message: 'Not found' });
                return;
            }
            sendJson(res, 500, { code: 'file_error', message: 'Unable to read file' });
            return;
        }

        const ext = path.extname(resolvedPath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': data.length
        });
        res.end(data);
    });
}

const server = http.createServer(async (req, res) => {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === 'GET' && requestUrl.pathname === '/api/skin') {
        const username = String(requestUrl.searchParams.get('username') || '').trim();
        if (!isValidUsername(username)) {
            sendJson(res, 400, { code: 'invalid_username', message: 'Username must be 3-16 characters: letters, numbers, underscore.' });
            return;
        }

        const result = await fetchSkinPng(username);
        if (result.kind === 'ok') {
            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Content-Length': result.buffer.length,
                'Cache-Control': 'no-store'
            });
            res.end(result.buffer);
            return;
        }
        if (result.kind === 'not-found') {
            sendJson(res, 404, { code: 'username_not_found', message: 'Username not found.' });
            return;
        }
        if (result.kind === 'network') {
            sendJson(res, 503, { code: 'network_failure', message: 'Network error while contacting Mojang APIs.' });
            return;
        }
        sendJson(res, 502, { code: 'upstream_failure', message: 'Mojang APIs returned an invalid response.' });
        return;
    }

    if (req.method === 'GET' || req.method === 'HEAD') {
        sendStaticFile(req, res, requestUrl.pathname);
        return;
    }

    sendJson(res, 405, { code: 'method_not_allowed', message: 'Method not allowed' });
});

server.listen(PORT, () => {
    console.log(`Offline Minecraft Skin Converter server running at http://localhost:${PORT}`);
});
