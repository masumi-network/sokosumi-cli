import {getApiKeyFromEnv} from '../utils/env.mjs';
import {getAuthManager} from './auth-manager.mjs';

/**
 * Decides whether the TUI can boot straight to the dashboard.
 * A stored OAuth session with an expired access token still counts when its
 * refresh token can mint a new one, so a restart does not force a re-login.
 * @param {Object} [options]
 * @param {Object} [options.authManager] - Injected auth manager (defaults to singleton)
 * @param {string|null} [options.apiKey] - Resolved API key (defaults to env/config)
 * @returns {Promise<boolean>}
 */
export async function resolveInitialAuth({
  authManager = getAuthManager(),
  apiKey = getApiKeyFromEnv(),
} = {}) {
  if (apiKey) return true;

  try {
    const token = await authManager.getAuthTokenAsync();
    return Boolean(token);
  } catch {
    return false;
  }
}

/**
 * Chooses the boot route from the three boot flags. Auth is never decided until
 * it resolves, so a pending refresh renders neither sign-in nor the dashboard.
 * @param {Object} state
 * @param {boolean} state.showLogo
 * @param {boolean} state.authResolved
 * @param {boolean} state.hasAuth
 * @returns {'logo'|'boot'|'dashboard'|'auth'}
 */
export function selectBootRoute({showLogo, authResolved, hasAuth} = {}) {
  if (showLogo) return 'logo';
  if (!authResolved) return 'boot';
  return hasAuth ? 'dashboard' : 'auth';
}
