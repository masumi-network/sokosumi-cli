import assert from 'node:assert/strict';
import test from 'node:test';

import {resolveInitialAuth, selectBootRoute} from '../../src/auth/bootstrap.mjs';

test('authorizes boot when a stored session refreshes after restart', async () => {
  let refreshed = false;
  const authManager = {
    getAuthTokenAsync: async () => {
      refreshed = true;
      return 'fresh-access-token';
    },
  };

  const hasAuth = await resolveInitialAuth({authManager, apiKey: null});

  assert.equal(hasAuth, true);
  assert.equal(refreshed, true);
});

test('routes to sign-in when the expired session cannot refresh', async () => {
  const authManager = {
    getAuthTokenAsync: async () => null,
  };

  const hasAuth = await resolveInitialAuth({authManager, apiKey: null});

  assert.equal(hasAuth, false);
});

test('routes to sign-in when refresh throws', async () => {
  const authManager = {
    getAuthTokenAsync: async () => {
      throw new Error('network down');
    },
  };

  const hasAuth = await resolveInitialAuth({authManager, apiKey: null});

  assert.equal(hasAuth, false);
});

test('authorizes boot from an API key without attempting refresh', async () => {
  let called = false;
  const authManager = {
    getAuthTokenAsync: async () => {
      called = true;
      return null;
    },
  };

  const hasAuth = await resolveInitialAuth({authManager, apiKey: 'soko_key'});

  assert.equal(hasAuth, true);
  assert.equal(called, false);
});

test('boot route shows the logo until it finishes, regardless of auth', () => {
  assert.equal(selectBootRoute({showLogo: true, authResolved: false, hasAuth: false}), 'logo');
  assert.equal(selectBootRoute({showLogo: true, authResolved: true, hasAuth: true}), 'logo');
});

test('boot route waits on an unresolved auth check instead of flashing a screen', () => {
  assert.equal(selectBootRoute({showLogo: false, authResolved: false, hasAuth: false}), 'boot');
  assert.equal(selectBootRoute({showLogo: false, authResolved: false, hasAuth: true}), 'boot');
});

test('boot route picks menu or auth only after auth resolves', () => {
  assert.equal(selectBootRoute({showLogo: false, authResolved: true, hasAuth: true}), 'menu');
  assert.equal(selectBootRoute({showLogo: false, authResolved: true, hasAuth: false}), 'auth');
});
