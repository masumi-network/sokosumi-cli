import {getApiBaseUrlFromEnv, getApiKeyFromEnv, loadEnvFromLocalFile} from '../utils/env.mjs';
import {getAuthManager} from '../auth/auth-manager.mjs';

function ensureEnvLoaded() {
  // Idempotent call; dotenv.config only populates once
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
 * Gets authentication headers (token or API key)
 * Prefers auth token over API key if both are available
 * @returns {Object} Headers object
 */
function getAuthHeaders() {
  const authManager = getAuthManager();
  const authToken = authManager.getAuthToken();

  // Prefer auth token over API key
  if (authToken) {
    return {
      'authorization': `Bearer ${authToken}`,
      'content-type': 'application/json',
    };
  }

  // Fall back to API key - API requires Bearer token authentication
  // per OpenAPI spec: "Supports Better Auth user credentials and dedicated coworker bearer API keys"
  const apiKey = getApiKeyFromEnv();
  if (apiKey) {
    return {
      'authorization': `Bearer ${apiKey}`,
      'content-type': 'application/json',
    };
  }

  // No authentication available
  throw new Error(
    'No authentication found. Please set SOKOSUMI_API_KEY in .env or login with: sokosumi auth login'
  );
}

export async function httpGet(pathname, {signal} = {}) {
  ensureEnvLoaded();
  const url = buildUrl(pathname);
  const headers = getAuthHeaders();

  const res = await fetch(url, {
    method: 'GET',
    headers,
    signal,
  });

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

export async function httpPost(pathname, body, {signal} = {}) {
  ensureEnvLoaded();
  const url = buildUrl(pathname);
  const headers = getAuthHeaders();

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
    signal,
  });

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

export async function httpPatch(pathname, body, {signal} = {}) {
  ensureEnvLoaded();
  const url = buildUrl(pathname);
  const headers = getAuthHeaders();

  const res = await fetch(url, {
    method: 'PATCH',
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
    signal,
  });

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

export async function httpDelete(pathname, {signal} = {}) {
  ensureEnvLoaded();
  const url = buildUrl(pathname);
  const headers = getAuthHeaders();

  const res = await fetch(url, {
    method: 'DELETE',
    headers,
    signal,
  });

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


