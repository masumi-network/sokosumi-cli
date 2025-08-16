import {getApiBaseUrlFromEnv, getApiKeyFromEnv, loadEnvFromLocalFile} from '../utils/env.mjs';

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

export async function httpGet(pathname, {signal} = {}) {
  ensureEnvLoaded();
  const url = buildUrl(pathname);

  const apiKey = getApiKeyFromEnv();
  if (!apiKey) {
    throw new Error('SOKOSUMI_API_KEY is not set in the environment (.env)');
  }

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
    },
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

  const apiKey = getApiKeyFromEnv();
  if (!apiKey) {
    throw new Error('SOKOSUMI_API_KEY is not set in the environment (.env)');
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
    },
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


