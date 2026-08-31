import {getAuthBaseUrlFromEnv} from '../utils/env.mjs';
import {refreshAccessToken} from './oauth.mjs';
import {keychainCredentialStore} from './secure-store.mjs';

const AUTH_TOKEN_ENV_NAME = 'SOKOSUMI_AUTH_TOKEN';
const OAUTH_CLIENT_ID_ENV_NAME = 'SOKOSUMI_OAUTH_CLIENT_ID';
const OAUTH_CLIENT_SECRET_ENV_NAME = 'SOKOSUMI_OAUTH_CLIENT_SECRET';

/**
 * Authentication Manager - Handles token lifecycle and authentication state.
 * Interactive OAuth credentials stay in the OS keychain.
 */
export class AuthManager {
  constructor({
    credentialStore = keychainCredentialStore,
    refreshTokenFn = refreshAccessToken,
  } = {}) {
    this.credentialStore = credentialStore;
    this.refreshTokenFn = refreshTokenFn;
    this.credentials = null;
    this.refreshPromise = null;
    this.loadCredentials();
  }

  loadCredentials() {
    this.credentials = this.credentialStore.read();
    return this.credentials;
  }

  saveCredentials(credentials) {
    if (!credentials || typeof credentials !== 'object' || !credentials.authToken) {
      throw new TypeError('authToken is required');
    }
    this.credentialStore.write(credentials);
    this.credentials = credentials;
    return credentials;
  }

  logout() {
    this.credentials = null;
    this.refreshPromise = null;
    this.credentialStore.clear();
  }

  isAuthenticated() {
    if (!this.credentials || !this.credentials.authToken) {
      return false;
    }

    if (this.isTokenExpired()) {
      return false;
    }

    return true;
  }

  isTokenExpired() {
    if (!this.credentials || !this.credentials.expiresAt) {
      return false;
    }

    try {
      const expiryDate = new Date(this.credentials.expiresAt);
      const now = new Date();
      const bufferMs = 5 * 60 * 1000;
      return now.getTime() > (expiryDate.getTime() - bufferMs);
    } catch (error) {
      console.error('Failed to parse expiry date:', error.message);
      return false;
    }
  }

  getAuthToken() {
    const envToken = typeof process.env[AUTH_TOKEN_ENV_NAME] === 'string'
      ? process.env[AUTH_TOKEN_ENV_NAME].trim()
      : '';

    if (envToken) {
      return envToken;
    }

    if (!this.isAuthenticated()) {
      return null;
    }
    return this.credentials.authToken;
  }

  async getAuthTokenAsync({
    authBaseUrl,
    clientId,
    clientSecret,
  } = {}) {
    const envToken = typeof process.env[AUTH_TOKEN_ENV_NAME] === 'string'
      ? process.env[AUTH_TOKEN_ENV_NAME].trim()
      : '';
    if (envToken) return envToken;
    if (this.isAuthenticated()) return this.credentials.authToken;

    const refreshToken = this.getRefreshToken();
    const resolvedClientId = String(
      clientId || process.env[OAUTH_CLIENT_ID_ENV_NAME] || '',
    ).trim();
    if (!refreshToken || !resolvedClientId) return null;

    if (!this.refreshPromise) {
      this.refreshPromise = (async () => {
        const refreshed = await this.refreshTokenFn({
          authBaseUrl: authBaseUrl || getAuthBaseUrlFromEnv(),
          clientId: resolvedClientId,
          clientSecret: clientSecret || process.env[OAUTH_CLIENT_SECRET_ENV_NAME],
          refreshToken,
        });
        const nextCredentials = {
          ...this.credentials,
          ...refreshed,
          refreshToken: refreshed.refreshToken || refreshToken,
        };
        this.saveCredentials(nextCredentials);
        return nextCredentials.authToken;
      })();
    }

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  getRefreshToken() {
    return this.credentials?.refreshToken || null;
  }

  getUserId() {
    return this.credentials?.userId || null;
  }

  getUserEmail() {
    return this.credentials?.email || null;
  }

  hasStoredCredentials() {
    return Boolean(this.credentialStore.read());
  }

  getCredentials() {
    return this.credentials;
  }
}

let authManagerInstance = null;

export function getAuthManager() {
  if (!authManagerInstance) {
    authManagerInstance = new AuthManager();
  }
  return authManagerInstance;
}
