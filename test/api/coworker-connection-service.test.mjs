import assert from 'node:assert/strict';
import test from 'node:test';

import {connectCoworker} from '../../src/api/services/coworker-connection-service.mjs';

test('connects a Coworker with the provider key in the request body', async () => {
  const originalFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (url, options) => {
    request = {url, options};
    return new Response(JSON.stringify({
      data: {
        coworkerId: 'coworker-1',
        organizationId: 'org-1',
        workspaceId: 'workspace-1',
        runtimeKey: {
          id: 'key-1',
          token: 'runtime-key-once',
          name: 'CLI runtime key',
          expiresAt: null,
        },
      },
      meta: {timestamp: '2030-01-01T00:00:00.000Z', requestId: 'req-1'},
    }), {status: 201, headers: {'content-type': 'application/json'}});
  };

  const previousApiUrl = process.env.SOKOSUMI_API_URL;
  const previousAuthToken = process.env.SOKOSUMI_AUTH_TOKEN;
  process.env.SOKOSUMI_API_URL = 'https://api.example.test';
  process.env.SOKOSUMI_AUTH_TOKEN = 'user-token';
  try {
    const result = await connectCoworker('coworker-1', {
      organizationId: 'org-1',
      baseURL: 'https://worker.example.test/responses',
      providerApiKey: 'provider-secret',
      idempotencyKey: 'connect-attempt-1',
    });

    assert.deepEqual(result.connection.runtimeKey, {
      id: 'key-1',
      token: 'runtime-key-once',
      name: 'CLI runtime key',
      expiresAt: null,
    });
    assert.equal(request.url, 'https://api.example.test/v1/coworkers/connect');
    assert.equal(request.options.headers.authorization, 'Bearer user-token');
    assert.deepEqual(JSON.parse(request.options.body), {
      coworkerId: 'coworker-1',
      organizationId: 'org-1',
      baseURL: 'https://worker.example.test/responses',
      providerApiKey: 'provider-secret',
      idempotencyKey: 'connect-attempt-1',
    });
  } finally {
    globalThis.fetch = originalFetch;
    if (previousApiUrl === undefined) delete process.env.SOKOSUMI_API_URL;
    else process.env.SOKOSUMI_API_URL = previousApiUrl;
    if (previousAuthToken === undefined) delete process.env.SOKOSUMI_AUTH_TOKEN;
    else process.env.SOKOSUMI_AUTH_TOKEN = previousAuthToken;
  }
});

test('validates required connection fields before sending secrets', async () => {
  await assert.rejects(
    () => connectCoworker('coworker-1', {providerApiKey: 'provider-secret'}),
    /organizationId is required/,
  );
  await assert.rejects(
    () => connectCoworker('coworker-1', {
      organizationId: 'org-1',
      baseURL: 'http://worker.example.test',
      providerApiKey: 'provider-secret',
    }),
    /baseURL must be an HTTPS URL/,
  );

  await assert.rejects(
    () => connectCoworker('coworker-1', {
      organizationId: 'org-1',
      baseURL: 'https://worker.example.test/responses',
      providerApiKey: 'provider-secret',
    }),
    /idempotencyKey is required/,
  );
});
