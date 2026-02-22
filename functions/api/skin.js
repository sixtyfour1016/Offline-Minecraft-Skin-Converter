const JSON_HEADERS = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
};

const REQUEST_HEADERS_JSON = {
    Accept: 'application/json',
    'User-Agent': 'Offline-Minecraft-Skin-Converter/1.0'
};

const REQUEST_HEADERS_PNG = {
    Accept: 'image/png',
    'User-Agent': 'Offline-Minecraft-Skin-Converter/1.0'
};

function pushTrace(trace, item) {
    if (!trace) {
        return;
    }
    trace.push({
        time: new Date().toISOString(),
        ...item
    });
}

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

async function fetchJson(url, trace, step) {
    const startMs = Date.now();
    let response;
    try {
        response = await fetch(url, {
            method: 'GET',
            headers: REQUEST_HEADERS_JSON
        });
    } catch (error) {
        pushTrace(trace, {
            step,
            phase: 'fetch_json',
            url,
            outcome: 'network_error',
            durationMs: Date.now() - startMs,
            error: String(error && error.message ? error.message : error)
        });
        throw error;
    }

    pushTrace(trace, {
        step,
        phase: 'fetch_json',
        url,
        status: response.status,
        ok: response.ok,
        durationMs: Date.now() - startMs
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

async function resolveUuid(username, trace) {
    const encoded = encodeURIComponent(username);
    const lookupOrder = [
        `https://api.minecraftservices.com/minecraft/profile/lookup/name/${encoded}`,
        `https://api.mojang.com/users/profiles/minecraft/${encoded}`
    ];
    let sawUpstreamError = false;

    for (const endpoint of lookupOrder) {
        try {
            const source = endpoint.includes('api.minecraftservices.com')
                ? 'minecraftservices'
                : 'mojang';
            const result = await fetchJson(endpoint, trace, `uuid_lookup_${source}`);
            if (result.kind === 'ok' && result.data && result.data.id) {
                const skinUrl = endpoint.includes('api.minecraftservices.com')
                    ? extractSkinUrlFromLookupProfile(result.data)
                    : '';
                pushTrace(trace, {
                    step: 'uuid_resolved',
                    source,
                    uuid: result.data.id,
                    hasSkinUrl: Boolean(skinUrl)
                });
                return { kind: 'ok', uuid: result.data.id, skinUrl };
            }
            if (result.kind === 'not-found') {
                pushTrace(trace, {
                    step: 'uuid_not_found_on_source',
                    source
                });
                continue;
            }
            sawUpstreamError = true;
            pushTrace(trace, {
                step: 'uuid_source_upstream_error',
                source,
                status: result.status
            });
        } catch (error) {
            pushTrace(trace, {
                step: 'uuid_lookup_network_failure',
                error: String(error && error.message ? error.message : error)
            });
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
    return normalizeHttpsUrl(rawUrl);
}

async function fetchSkinImage(skinUrl, trace, step) {
    const normalizedUrl = normalizeHttpsUrl(skinUrl);
    if (!normalizedUrl) {
        pushTrace(trace, {
            step,
            phase: 'skin_image_fetch',
            outcome: 'missing_or_invalid_url'
        });
        return { kind: 'upstream' };
    }

    const startMs = Date.now();
    try {
        const response = await fetch(normalizedUrl, {
            method: 'GET',
            headers: REQUEST_HEADERS_PNG
        });
        pushTrace(trace, {
            step,
            phase: 'skin_image_fetch',
            url: normalizedUrl,
            status: response.status,
            ok: response.ok,
            contentType: String(response.headers.get('content-type') || ''),
            durationMs: Date.now() - startMs
        });
        if (!response.ok) {
            return { kind: 'upstream' };
        }
        const arrayBuffer = await response.arrayBuffer();
        if (!arrayBuffer || !arrayBuffer.byteLength) {
            pushTrace(trace, {
                step,
                phase: 'skin_image_fetch',
                outcome: 'empty_response_body'
            });
            return { kind: 'upstream' };
        }
        pushTrace(trace, {
            step,
            phase: 'skin_image_fetch',
            outcome: 'ok',
            bytes: arrayBuffer.byteLength
        });
        return { kind: 'ok', arrayBuffer };
    } catch (error) {
        pushTrace(trace, {
            step,
            phase: 'skin_image_fetch',
            outcome: 'network_error',
            durationMs: Date.now() - startMs,
            error: String(error && error.message ? error.message : error)
        });
        return { kind: 'network' };
    }
}

async function fetchSkinPng(username, trace) {
    const uuidResult = await resolveUuid(username, trace);
    if (uuidResult.kind === 'not-found') {
        pushTrace(trace, { step: 'final', outcome: 'username_not_found' });
        return { kind: 'not-found' };
    }
    if (uuidResult.kind === 'network') {
        pushTrace(trace, { step: 'final', outcome: 'network_failure_during_uuid_lookup' });
        return { kind: 'network' };
    }
    if (uuidResult.kind !== 'ok') {
        pushTrace(trace, { step: 'final', outcome: 'upstream_failure_during_uuid_lookup' });
        return { kind: 'upstream' };
    }

    if (uuidResult.skinUrl) {
        const directSkinResult = await fetchSkinImage(uuidResult.skinUrl, trace, 'direct_skin_fetch_from_lookup');
        if (directSkinResult.kind === 'ok' || directSkinResult.kind === 'network') {
            return directSkinResult;
        }
    }

    const sessionUrl = `https://sessionserver.mojang.com/session/minecraft/profile/${toUndashedUuid(uuidResult.uuid)}`;
    const sessionResult = await fetchJson(sessionUrl, trace, 'session_profile_lookup');
    if (sessionResult.kind === 'not-found') {
        pushTrace(trace, { step: 'final', outcome: 'session_profile_not_found' });
        return { kind: 'not-found' };
    }
    if (sessionResult.kind !== 'ok') {
        pushTrace(trace, {
            step: 'final',
            outcome: 'session_profile_upstream_failure',
            status: sessionResult.status
        });
        return { kind: 'upstream' };
    }

    let skinUrl = '';
    try {
        skinUrl = extractSkinUrl(sessionResult.data);
    } catch (error) {
        pushTrace(trace, {
            step: 'session_profile_parse_error',
            error: String(error && error.message ? error.message : error)
        });
        return { kind: 'upstream' };
    }
    if (!skinUrl) {
        pushTrace(trace, { step: 'session_profile_missing_skin_url' });
        return { kind: 'upstream' };
    }

    return fetchSkinImage(skinUrl, trace, 'skin_fetch_from_session_profile');
}

function resultToErrorResponse(result) {
    if (result.kind === 'not-found') {
        return {
            status: 404,
            payload: {
                code: 'username_not_found',
                message: 'Username not found.'
            }
        };
    }
    if (result.kind === 'network') {
        return {
            status: 503,
            payload: {
                code: 'network_failure',
                message: 'Network error while contacting Mojang APIs.'
            }
        };
    }
    return {
        status: 502,
        payload: {
            code: 'upstream_failure',
            message: 'Mojang APIs returned an invalid response.'
        }
    };
}

export async function onRequest(context) {
    if (context.request.method !== 'GET') {
        return sendJson(405, {
            code: 'method_not_allowed',
            message: 'Method not allowed'
        });
    }

    const requestUrl = new URL(context.request.url);
    const debugEnabled = requestUrl.searchParams.get('debug') === '1';
    const trace = debugEnabled ? [] : null;
    const username = String(requestUrl.searchParams.get('username') || '').trim();
    if (!isValidUsername(username)) {
        const payload = {
            code: 'invalid_username',
            message: 'Username must be 3-16 characters: letters, numbers, underscore.'
        };
        if (debugEnabled) {
            payload.trace = trace;
        }
        return sendJson(400, payload);
    }

    const result = await fetchSkinPng(username, trace);
    if (result.kind === 'ok') {
        if (debugEnabled) {
            return sendJson(200, {
                code: 'ok',
                message: 'Skin resolved successfully.',
                bytes: result.arrayBuffer.byteLength,
                trace
            });
        }
        return new Response(result.arrayBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'image/png',
                'Content-Length': String(result.arrayBuffer.byteLength),
                'Cache-Control': 'no-store'
            }
        });
    }

    const errorResponse = resultToErrorResponse(result);
    if (debugEnabled) {
        return sendJson(errorResponse.status, {
            ...errorResponse.payload,
            trace
        });
    }
    return sendJson(errorResponse.status, errorResponse.payload);
}
