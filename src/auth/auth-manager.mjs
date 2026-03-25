import {
  readCredentials,
  writeCredentials,
  clearCredentials,
  hasStoredCredentials
} from './token-store.mjs';

/**
 * Authentication Manager - Handles token lifecycle and authentication state
 */
export class AuthManager {
  constructor() {
    this.credentials = null;
    this.loadCredentials();
  }

  /**
   * Loads credentials from disk
   */
  loadCredentials() {
    this.credentials = readCredentials();
  }

  /**
   * Saves authentication credentials
   * @param {Object} credentials - Credentials to store
   * @param {string} credentials.authToken - Authentication token
   * @param {string} [credentials.refreshToken] - Refresh token
   * @param {string} [credentials.expiresAt] - ISO timestamp
   * @param {string} [credentials.userId] - User ID
   * @param {string} [credentials.email] - User email
   */
  saveCredentials(credentials) {
    this.credentials = credentials;
    writeCredentials(credentials);
  }

  /**
   * Clears stored credentials and logs out
   */
  logout() {
    this.credentials = null;
    clearCredentials();
  }

  /**
   * Checks if user is authenticated (has valid credentials)
   * @returns {boolean}
   */
  isAuthenticated() {
    if (!this.credentials || !this.credentials.authToken) {
      return false;
    }

    // Check if token is expired
    if (this.isTokenExpired()) {
      return false;
    }

    return true;
  }

  /**
   * Checks if the stored token is expired
   * @returns {boolean}
   */
  isTokenExpired() {
    if (!this.credentials || !this.credentials.expiresAt) {
      return false; // No expiry set, assume valid
    }

    try {
      const expiryDate = new Date(this.credentials.expiresAt);
      const now = new Date();

      // Add 5 minute buffer before expiry
      const bufferMs = 5 * 60 * 1000;
      return now.getTime() > (expiryDate.getTime() - bufferMs);
    } catch (error) {
      console.error('Failed to parse expiry date:', error.message);
      return false;
    }
  }

  /**
   * Gets the current auth token
   * @returns {string|null}
   */
  getAuthToken() {
    if (!this.isAuthenticated()) {
      return null;
    }
    return this.credentials.authToken;
  }

  /**
   * Gets the refresh token
   * @returns {string|null}
   */
  getRefreshToken() {
    return this.credentials?.refreshToken || null;
  }

  /**
   * Gets the user ID
   * @returns {string|null}
   */
  getUserId() {
    return this.credentials?.userId || null;
  }

  /**
   * Gets the user email
   * @returns {string|null}
   */
  getUserEmail() {
    return this.credentials?.email || null;
  }

  /**
   * Checks if credentials are stored on disk
   * @returns {boolean}
   */
  hasStoredCredentials() {
    return hasStoredCredentials();
  }

  /**
   * Gets all credentials (for debugging)
   * @returns {Object|null}
   */
  getCredentials() {
    return this.credentials;
  }
}

/**
 * Singleton instance
 */
let authManagerInstance = null;

/**
 * Gets the singleton AuthManager instance
 * @returns {AuthManager}
 */
export function getAuthManager() {
  if (!authManagerInstance) {
    authManagerInstance = new AuthManager();
  }
  return authManagerInstance;
}
