import fs from 'fs';
import path from 'path';
import {homedir} from 'os';

const SOKOSUMI_DIR = path.join(homedir(), '.sokosumi');
const CREDENTIALS_FILE = path.join(SOKOSUMI_DIR, 'credentials.json');

/**
 * Token Store - Manages secure storage of authentication tokens
 * Stores tokens in ~/.sokosumi/credentials.json
 */

/**
 * Ensures the .sokosumi directory exists
 */
function ensureSokosumiDir() {
  if (!fs.existsSync(SOKOSUMI_DIR)) {
    fs.mkdirSync(SOKOSUMI_DIR, {recursive: true, mode: 0o700});
  }
}

/**
 * Reads credentials from disk
 * @returns {Object|null} Credentials object or null if not found
 */
export function readCredentials() {
  try {
    ensureSokosumiDir();

    if (!fs.existsSync(CREDENTIALS_FILE)) {
      return null;
    }

    const content = fs.readFileSync(CREDENTIALS_FILE, 'utf8');
    const credentials = JSON.parse(content);

    return credentials;
  } catch (error) {
    console.error('Failed to read credentials:', error.message);
    return null;
  }
}

/**
 * Writes credentials to disk
 * @param {Object} credentials - Credentials object to store
 * @param {string} credentials.authToken - Authentication token
 * @param {string} [credentials.refreshToken] - Refresh token (optional)
 * @param {string} [credentials.expiresAt] - ISO timestamp when token expires
 * @param {string} [credentials.userId] - User ID
 * @param {string} [credentials.email] - User email
 */
export function writeCredentials(credentials) {
  try {
    ensureSokosumiDir();

    const data = JSON.stringify(credentials, null, 2);
    fs.writeFileSync(CREDENTIALS_FILE, data, {mode: 0o600});

    return true;
  } catch (error) {
    console.error('Failed to write credentials:', error.message);
    throw error;
  }
}

/**
 * Clears stored credentials
 */
export function clearCredentials() {
  try {
    if (fs.existsSync(CREDENTIALS_FILE)) {
      fs.unlinkSync(CREDENTIALS_FILE);
    }
    return true;
  } catch (error) {
    console.error('Failed to clear credentials:', error.message);
    throw error;
  }
}

/**
 * Checks if credentials file exists
 * @returns {boolean}
 */
export function hasStoredCredentials() {
  return fs.existsSync(CREDENTIALS_FILE);
}

/**
 * Gets the path to the credentials file
 * @returns {string}
 */
export function getCredentialsPath() {
  return CREDENTIALS_FILE;
}
