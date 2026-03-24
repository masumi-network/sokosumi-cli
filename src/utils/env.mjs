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
const DEFAULT_API_URL = 'https://api.sokosumi.com';

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

function hydrateProcessEnvFromConfig() {
  const config = readCliConfig();

  if (!process.env[KEY_NAME] && typeof config.apiKey === 'string' && config.apiKey.trim()) {
    process.env[KEY_NAME] = config.apiKey.trim();
  }

  if (!process.env[URL_NAME] && typeof config.apiUrl === 'string' && config.apiUrl.trim()) {
    process.env[URL_NAME] = config.apiUrl.trim();
  }

  if (!process.env[WEB_URL_NAME] && typeof config.webUrl === 'string' && config.webUrl.trim()) {
    process.env[WEB_URL_NAME] = config.webUrl.trim();
  }

  if (!process.env[AUTH_URL_NAME] && typeof config.authUrl === 'string' && config.authUrl.trim()) {
    process.env[AUTH_URL_NAME] = config.authUrl.trim();
  }
}

function deriveWebUrlFromApiUrl(apiUrl) {
  const fallback = 'https://sokosumi.com';

  try {
    const parsed = new URL(apiUrl || DEFAULT_API_URL);

    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      return `${parsed.protocol}//${parsed.hostname}:3000`;
    }

    const next = new URL(parsed.origin);
    next.hostname = next.hostname.replace(/^api\./, '');
    return next.toString().replace(/\/+$/g, '');
  } catch {
    return fallback;
  }
}

export function loadEnvFromLocalFile() {
  dotenv.config({path: ENV_FILE});
  hydrateProcessEnvFromConfig();

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

export async function writeApiKeyToEnv(apiKey) {
  const trimmedApiKey = String(apiKey || '').trim();
  await writeCliConfig({apiKey: trimmedApiKey});
  process.env[KEY_NAME] = trimmedApiKey;
}

export function getCliConfigPath() {
  return CONFIG_FILE;
}

