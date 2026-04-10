import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import {homedir} from 'os';

const ENV_FILE = path.resolve(process.cwd(), '.env');
const SOKOSUMI_DIR = path.join(homedir(), '.sokosumi');
const CONFIG_FILE = path.join(SOKOSUMI_DIR, 'config.json');
const KEY_NAME = 'SOKOSUMI_API_KEY';
const URL_NAME = 'SOKOSUMI_API_URL';
const WEB_URL_NAME = 'SOKOSUMI_WEB_URL';
const AUTH_URL_NAME = 'SOKOSUMI_AUTH_URL';
export const DEFAULT_API_URL = 'https://api.sokosumi.com';
export const PREPROD_API_URL = 'https://api.preprod.sokosumi.com';
const KNOWN_API_URLS = [DEFAULT_API_URL, PREPROD_API_URL];

function ensureSokosumiDir() {
  if (!fs.existsSync(SOKOSUMI_DIR)) {
    fs.mkdirSync(SOKOSUMI_DIR, {recursive: true, mode: 0o700});
  }
}

function readCliConfig() {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return {};
    }

    const content = fs.readFileSync(CONFIG_FILE, 'utf8');
    const parsed = JSON.parse(content);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function setProcessEnvValue(name, value) {
  if (typeof value !== 'string') return;
  const trimmedValue = value.trim();
  if (!trimmedValue) return;
  process.env[name] = trimmedValue;
}

async function writeCliConfig(nextValues) {
  ensureSokosumiDir();
  const current = readCliConfig();
  const merged = {
    ...current,
    ...nextValues,
  };

  await fsPromises.writeFile(CONFIG_FILE, JSON.stringify(merged, null, 2), {
    mode: 0o600,
    encoding: 'utf8',
  });
}

function hydrateProcessEnvFromConfig({preserveExisting = {}} = {}) {
  const config = readCliConfig();

  if (!preserveExisting.apiKey) {
    setProcessEnvValue(KEY_NAME, config.apiKey);
  }

  if (!preserveExisting.apiUrl) {
    setProcessEnvValue(URL_NAME, config.apiUrl);
  }

  if (!preserveExisting.webUrl) {
    setProcessEnvValue(WEB_URL_NAME, config.webUrl);
  }

  if (!preserveExisting.authUrl) {
    setProcessEnvValue(AUTH_URL_NAME, config.authUrl);
  }
}

export function deriveWebUrlFromApiUrl(apiUrl) {
  const fallback = 'https://app.sokosumi.com';

  try {
    const parsed = new URL(apiUrl || DEFAULT_API_URL);

    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      return `${parsed.protocol}//${parsed.hostname}:3000`;
    }

    const next = new URL(parsed.origin);
    next.hostname = next.hostname.replace(/^api\./, 'app.');
    return next.toString().replace(/\/+$/g, '');
  } catch {
    return fallback;
  }
}

export function deriveAuthUrlFromApiUrl(apiUrl) {
  return `${deriveWebUrlFromApiUrl(apiUrl)}/api/auth`;
}

export function loadEnvFromLocalFile() {
  const preserveExisting = {
    apiKey: Boolean(process.env[KEY_NAME]),
    apiUrl: Boolean(process.env[URL_NAME]),
    webUrl: Boolean(process.env[WEB_URL_NAME]),
    authUrl: Boolean(process.env[AUTH_URL_NAME]),
  };

  dotenv.config({path: ENV_FILE});
  hydrateProcessEnvFromConfig({preserveExisting});

  if (!process.env[URL_NAME]) {
    process.env[URL_NAME] = DEFAULT_API_URL;
  }
}

export function getApiKeyFromEnv() {
  const configured = process.env[KEY_NAME];
  if (configured) {
    return configured;
  }

  const config = readCliConfig();
  return typeof config.apiKey === 'string' && config.apiKey.trim()
    ? config.apiKey.trim()
    : null;
}

export function getApiBaseUrlFromEnv() {
  return process.env[URL_NAME] || readCliConfig().apiUrl || DEFAULT_API_URL;
}

export function getWebBaseUrlFromEnv() {
  return process.env[WEB_URL_NAME] || readCliConfig().webUrl || deriveWebUrlFromApiUrl(getApiBaseUrlFromEnv());
}

export function getAuthBaseUrlFromEnv() {
  return process.env[AUTH_URL_NAME] || readCliConfig().authUrl || `${getWebBaseUrlFromEnv()}/api/auth`;
}

export function getKnownApiBaseUrls() {
  return [...KNOWN_API_URLS];
}

export function getApiEnvironmentName(apiUrl) {
  return String(apiUrl || '').includes('.preprod.')
    ? 'preprod'
    : 'production';
}

export async function writeApiKeyToEnv(apiKey, {apiUrl, webUrl, authUrl} = {}) {
  const trimmedApiKey = String(apiKey || '').trim();
  const resolvedApiUrl = String(apiUrl || getApiBaseUrlFromEnv() || DEFAULT_API_URL).trim();
  const resolvedWebUrl = String(webUrl || deriveWebUrlFromApiUrl(resolvedApiUrl)).trim();
  const resolvedAuthUrl = String(authUrl || deriveAuthUrlFromApiUrl(resolvedApiUrl)).trim();

  await writeCliConfig({
    apiKey: trimmedApiKey,
    apiUrl: resolvedApiUrl,
    webUrl: resolvedWebUrl,
    authUrl: resolvedAuthUrl,
  });

  setProcessEnvValue(KEY_NAME, trimmedApiKey);
  setProcessEnvValue(URL_NAME, resolvedApiUrl);
  setProcessEnvValue(WEB_URL_NAME, resolvedWebUrl);
  setProcessEnvValue(AUTH_URL_NAME, resolvedAuthUrl);

  return {
    apiKey: trimmedApiKey,
    apiUrl: resolvedApiUrl,
    webUrl: resolvedWebUrl,
    authUrl: resolvedAuthUrl,
  };
}

export function getCliConfigPath() {
  return CONFIG_FILE;
}
