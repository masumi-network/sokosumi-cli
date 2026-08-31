import assert from 'node:assert/strict';
import test from 'node:test';

import {runCli} from '../../src/cli/index.mjs';

function outputBuffer() {
  let value = '';
  return {
    write(chunk) {
      value += String(chunk);
    },
    text() {
      return value;
    },
  };
}

test('connects a Coworker from headless JSON input without exposing the provider key in output', async () => {
  const originalFetch = globalThis.fetch;
  const previousValues = {
    apiUrl: process.env.SOKOSUMI_API_URL,
    authToken: process.env.SOKOSUMI_AUTH_TOKEN,
    providerKey: process.env.SOKOSUMI_PROVIDER_API_KEY,
  };
  const stdout = outputBuffer();
  const stderr = outputBuffer();
  let request;

  process.env.SOKOSUMI_API_URL = 'https://api.example.test';
  process.env.SOKOSUMI_AUTH_TOKEN = 'user-token';
  process.env.SOKOSUMI_PROVIDER_API_KEY = 'provider-secret';
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

  try {
    const exitCode = await runCli([
      'coworkers',
      'connect',
      'coworker-1',
      '--organization-id',
      'org-1',
      '--base-url',
      'https://worker.example.test/responses',
      '--idempotency-key',
      'attempt-1',
      '--json',
    ], {stdout, stderr, stdin: {isTTY: false}});

    assert.equal(exitCode, 0);
    assert.equal(request.options.headers.authorization, 'Bearer user-token');
    assert.equal(JSON.parse(request.options.body).providerApiKey, 'provider-secret');
    const output = stdout.text();
    assert.match(output, /runtime-key-once/);
    assert.doesNotMatch(output, /provider-secret/);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [name, value] of Object.entries(previousValues)) {
      const envName = name === 'apiUrl'
        ? 'SOKOSUMI_API_URL'
        : name === 'authToken'
          ? 'SOKOSUMI_AUTH_TOKEN'
          : 'SOKOSUMI_PROVIDER_API_KEY';
      if (value === undefined) delete process.env[envName];
      else process.env[envName] = value;
    }
  }
});
