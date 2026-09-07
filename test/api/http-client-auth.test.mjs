import assert from 'node:assert/strict';
import test from 'node:test';

import {getAuthHeaders} from '../../src/api/http-client.mjs';

test('falls back to configured API key when OAuth refresh throws', async () => {
  const headers = await getAuthHeaders({
    authManager: {
      getAuthTokenAsync: async () => {
        throw new Error('network down');
      },
    },
    resolveApiKey: () => 'soko_fallback_key',
  });

  assert.equal(headers.authorization, 'Bearer soko_fallback_key');
});

test('still fails when OAuth refresh throws and no API key is configured', async () => {
  await assert.rejects(
    getAuthHeaders({
      authManager: {
        getAuthTokenAsync: async () => {
          throw new Error('network down');
        },
      },
      resolveApiKey: () => null,
    }),
    /No authentication found/,
  );
});

test('prefers a successful OAuth token over the configured API key', async () => {
  const headers = await getAuthHeaders({
    authManager: {
      getAuthTokenAsync: async () => 'oauth-access-token',
    },
    resolveApiKey: () => 'soko_fallback_key',
  });

  assert.equal(headers.authorization, 'Bearer oauth-access-token');
});
