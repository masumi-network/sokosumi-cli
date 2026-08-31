import {getApiBaseUrlFromEnv, getApiKeyFromEnv, loadEnvFromLocalFile} from '../utils/env.mjs';
import {getAuthManager} from '../auth/auth-manager.mjs';

function ensureEnvLoaded() {
  loadEnvFromLocalFile();
}

function buildUrl(pathname) {
  const base = getApiBaseUrlFromEnv();
  if (!base) {
    throw new Error('SOKOSUMI_API_URL is not set in the environment (.env)');
  }
  const trimmedBase = base.replace(/\/+$/g, '');
  const trimmedPath = String(pathname || '').replace(/^\/+/, '');
  return `${trimmedBase}/${trimmedPath}`;
}

/**
 * Gets authentication headers.
 * An explicit authToken is used for Coworker runtime calls so a stored user
 * token cannot be selected by accident.
 */
async function getAuthHeaders({authToken, apiKey} = {}) {
  const explicitToken = typeof authToken === 'string' ? authToken.trim() : '';
  if (explicitToken) {
    return {
      authorization: `Bearer ${explicitToken}`,
      'content-type': 'application/json',
    };
  }

  const explicitApiKey = typeof apiKey === 'string' ? apiKey.trim() : '';
  if (explicitApiKey) {
    return {
      authorization: `Bearer ${explicitApiKey}`,
      'content-type': 'application/json',
    };
  }

  const authManager = getAuthManager();
  const storedAuthToken = await authManager.getAuthTokenAsync();
  if (storedAuthToken) {
    return {
      authorization: `Bearer ${storedAuthToken}`,
      'content-type': 'application/json',
    };
  }

  const configuredApiKey = getApiKeyFromEnv();
  if (configuredApiKey) {
    return {
      authorization: `Bearer ${configuredApiKey}`,
      'content-type': 'application/json',
    };
  }

  throw new Error(
    'No authentication found. Start the CLI and choose Authentication, or set SOKOSUMI_API_KEY or SOKOSUMI_AUTH_TOKEN.',
  );
}

async function request(method, pathname, body, {signal, authToken, apiKey} = {}) {
  ensureEnvLoaded();
  const url = buildUrl(pathname);
  const headers = await getAuthHeaders({authToken, apiKey});
  const options = {method, headers, signal};
  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (err) {
    const error = new Error('Failed to parse JSON response');
    error.cause = err;
    error.status = res.status;
    error.body = text;
    throw error;
  }

  if (!res.ok) {
    const error = new Error(`Request failed with status ${res.status}`);
    error.status = res.status;
    error.body = json ?? text;
    throw error;
  }

  return json;
}

export function httpGet(pathname, options = {}) {
  return request('GET', pathname, undefined, options);
}

export function httpPost(pathname, body, options = {}) {
  return request('POST', pathname, body, options);
}

export function httpPatch(pathname, body, options = {}) {
  return request('PATCH', pathname, body, options);
}

export function httpDelete(pathname, options = {}) {
  return request('DELETE', pathname, undefined, options);
}
