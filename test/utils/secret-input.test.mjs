import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import test from 'node:test';

import {resolveSecret} from '../../src/utils/secret-input.mjs';

test('uses an environment secret without reading stdin', async () => {
  const value = await resolveSecret({
    env: {SOKOSUMI_PROVIDER_API_KEY: 'provider-secret'},
    envName: 'SOKOSUMI_PROVIDER_API_KEY',
    stdin: Readable.from([]),
    jsonOutput: true,
  });

  assert.equal(value, 'provider-secret');
});

test('reads a provider secret from stdin only when requested', async () => {
  const value = await resolveSecret({
    env: {},
    envName: 'SOKOSUMI_PROVIDER_API_KEY',
    stdin: Readable.from(['provider-', 'secret\n']),
    fromStdin: true,
    jsonOutput: true,
  });

  assert.equal(value, 'provider-secret');
});

test('does not block headless JSON commands waiting for a secret', async () => {
  await assert.rejects(
    () => resolveSecret({
      env: {},
      envName: 'SOKOSUMI_PROVIDER_API_KEY',
      stdin: Readable.from([]),
      jsonOutput: true,
    }),
    /SOKOSUMI_PROVIDER_API_KEY.*--provider-api-key-stdin/,
  );
});
