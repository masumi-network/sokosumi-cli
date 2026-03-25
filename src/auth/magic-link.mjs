import {
  deriveAuthUrlFromApiUrl,
  deriveWebUrlFromApiUrl,
  getApiBaseUrlFromEnv,
  getAuthBaseUrlFromEnv,
  getApiEnvironmentName,
  getKnownApiBaseUrls,
  getWebBaseUrlFromEnv,
  loadEnvFromLocalFile
} from '../utils/env.mjs';

function ensureEnvLoaded() {
  loadEnvFromLocalFile();
}

function buildUrl(baseUrl, pathname) {
  const base = String(baseUrl || '').replace(/\/+$/g, '');
  const path = String(pathname || '').replace(/^\/+/g, '');
  return `${base}/${path}`;
}

function parseErrorPayload(payload, fallbackMessage) {
  if (!payload) {
    return fallbackMessage;
  }

  if (typeof payload === 'string' && payload.trim()) {
    return payload.trim();
  }

  if (typeof payload === 'object') {
    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message.trim();
    }
    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error.trim();
    }
    if (payload.data && typeof payload.data === 'object') {
      return parseErrorPayload(payload.data, fallbackMessage);
    }
  }

  return fallbackMessage;
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function parseJsonSafely(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function getConnectionsUrl() {
  ensureEnvLoaded();
  return buildUrl(getWebBaseUrlFromEnv(), '/connections');
}

export function getOAuthClientsUrl() {
  ensureEnvLoaded();
  return buildUrl(getWebBaseUrlFromEnv(), '/oauth/client');
}

export async function requestMagicLinkSignIn(email, {callbackUrl} = {}) {
  ensureEnvLoaded();

  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmail(normalizedEmail)) {
    throw new Error('Enter a valid email address');
  }

  const authUrl = buildUrl(getAuthBaseUrlFromEnv(), '/sign-in/magic-link');
  const response = await fetch(authUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      email: normalizedEmail,
      callbackURL: callbackUrl || getConnectionsUrl(),
    }),
  });

  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(
      parseErrorPayload(payload, `Failed to send sign-in link (${response.status})`)
    );
  }

  return payload;
}

export async function validateApiKey(apiKey) {
  ensureEnvLoaded();

  const trimmedApiKey = String(apiKey || '').trim();
  if (!trimmedApiKey) {
    throw new Error('Enter a Sokosumi API key');
  }

  const response = await fetch(buildUrl(getApiBaseUrlFromEnv(), '/v1/users/me'), {
    method: 'GET',
    headers: {
      'authorization': `Bearer ${trimmedApiKey}`,
      'content-type': 'application/json',
    },
  });

  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(
      parseErrorPayload(payload, `Failed to verify API key (${response.status})`)
    );
  }

  return payload;
}

async function validateApiKeyAgainstBaseUrl(apiKey, apiBaseUrl) {
  const response = await fetch(buildUrl(apiBaseUrl, '/v1/users/me'), {
    method: 'GET',
    headers: {
      'authorization': `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
  });

  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(
      parseErrorPayload(payload, `Failed to verify API key (${response.status})`)
    );
  }

  return payload;
}

export async function resolveApiKeyEnvironment(apiKey) {
  ensureEnvLoaded();

  const trimmedApiKey = String(apiKey || '').trim();
  if (!trimmedApiKey) {
    throw new Error('Enter a Sokosumi API key');
  }

  let lastError = null;

  for (const apiBaseUrl of getKnownApiBaseUrls()) {
    try {
      const payload = await validateApiKeyAgainstBaseUrl(trimmedApiKey, apiBaseUrl);
      const webBaseUrl = deriveWebUrlFromApiUrl(apiBaseUrl);
      const authBaseUrl = deriveAuthUrlFromApiUrl(apiBaseUrl);

      return {
        apiBaseUrl,
        webBaseUrl,
        authBaseUrl,
        environmentName: getApiEnvironmentName(apiBaseUrl),
        payload,
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Failed to verify API key');
}
