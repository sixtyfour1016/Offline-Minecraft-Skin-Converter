const JSON_HEADERS = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
};

function sendJson(status, payload) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: JSON_HEADERS
    });
}

function isValidUsername(username) {
    return /^[A-Za-z0-9_]{3,16}$/.test(username);
}

function toUndashedUuid(uuid) {
    return String(uuid || '').replace(/-/g, '').toLowerCase();
}

async function fetchJson(url) {
    const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' }
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
                return { kind: 'ok', uuid: result.data.id };
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

    const decoded = atob(String(texturesProp.value));
    const parsed = JSON.parse(decoded);
    const rawUrl = parsed && parsed.textures && parsed.textures.SKIN
        ? parsed.textures.SKIN.url
        : '';
    return String(rawUrl || '').replace(/^http:\/\//i, 'https://');
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

    try {
        const response = await fetch(skinUrl, {
            method: 'GET',
            headers: { Accept: 'image/png' }
        });
        if (!response.ok) {
            return { kind: 'upstream' };
        }
        const arrayBuffer = await response.arrayBuffer();
        return { kind: 'ok', arrayBuffer };
    } catch (error) {
        return { kind: 'network' };
    }
}

export async function onRequest(context) {
    if (context.request.method !== 'GET') {
        return sendJson(405, {
            code: 'method_not_allowed',
            message: 'Method not allowed'
        });
    }

    const requestUrl = new URL(context.request.url);
    const username = String(requestUrl.searchParams.get('username') || '').trim();
    if (!isValidUsername(username)) {
        return sendJson(400, {
            code: 'invalid_username',
            message: 'Username must be 3-16 characters: letters, numbers, underscore.'
        });
    }

    const result = await fetchSkinPng(username);
    if (result.kind === 'ok') {
        return new Response(result.arrayBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'image/png',
                'Content-Length': String(result.arrayBuffer.byteLength),
                'Cache-Control': 'no-store'
            }
        });
    }
    if (result.kind === 'not-found') {
        return sendJson(404, {
            code: 'username_not_found',
            message: 'Username not found.'
        });
    }
    if (result.kind === 'network') {
        return sendJson(503, {
            code: 'network_failure',
            message: 'Network error while contacting Mojang APIs.'
        });
    }
    return sendJson(502, {
        code: 'upstream_failure',
        message: 'Mojang APIs returned an invalid response.'
    });
}
