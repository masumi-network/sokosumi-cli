import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

const ENV_FILE = path.resolve(process.cwd(), '.env');
const KEY_NAME = 'SOKOSUMI_API_KEY';
const URL_NAME = 'SOKOSUMI_API_URL';

export function loadEnvFromLocalFile() {
  dotenv.config({path: ENV_FILE});
}

export function getApiKeyFromEnv() {
  return process.env[KEY_NAME] || null;
}

export function getApiBaseUrlFromEnv() {
  return process.env[URL_NAME] || null;
}

export async function writeApiKeyToEnv(apiKey) {
  const keyLine = `${KEY_NAME}=${apiKey}`;
  let content = '';
  try {
    content = await fs.readFile(ENV_FILE, 'utf8');
  } catch {
    // file not found, will create
  }

  const lines = content ? content.split(/\r?\n/) : [];
  const idx = lines.findIndex(l => l.startsWith(`${KEY_NAME}=`));
  if (idx >= 0) {
    lines[idx] = keyLine;
  } else {
    lines.push(keyLine);
  }
  const next = lines.filter(Boolean).join('\n') + '\n';
  await fs.writeFile(ENV_FILE, next, 'utf8');
  process.env[KEY_NAME] = apiKey;
}


