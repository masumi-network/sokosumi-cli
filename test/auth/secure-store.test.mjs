import assert from 'node:assert/strict';
import test from 'node:test';

import {createKeychainCredentialStore} from '../../src/auth/secure-store.mjs';

test('stores OAuth credentials in the macOS Keychain command', () => {
  const calls = [];
  const credentials = {
    authToken: 'access-token',
    refreshToken: 'refresh-token',
    expiresAt: '2030-01-01T00:00:00.000Z',
  };
  const execFileSync = (command, args) => {
    calls.push({command, args});
    return '';
  };
  const store = createKeychainCredentialStore({platform: 'darwin', execFileSync});

  store.write(credentials);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].command, '/usr/bin/security');
  assert.deepEqual(calls[0].args.slice(0, 6), [
    'add-generic-password',
    '-a',
    'oauth',
    '-s',
    'sokosumi-cli',
    '-w',
  ]);
  assert.equal(calls[0].args[6], JSON.stringify(credentials));
  assert.ok(calls[0].args.includes('-U'));
});

test('reads and clears credentials without a plaintext file fallback', () => {
  const calls = [];
  const execFileSync = (command, args) => {
    calls.push({command, args});
    if (args[0] === 'find-generic-password') {
      return JSON.stringify({authToken: 'access-token'});
    }
    return '';
  };
  const store = createKeychainCredentialStore({platform: 'darwin', execFileSync});

  assert.deepEqual(store.read(), {authToken: 'access-token'});
  store.clear();

  assert.equal(calls[1].args[0], 'delete-generic-password');
  assert.ok(calls.every(({args}) => !args.includes('credentials.json')));
});

test('redacts credentials from Keychain write failures', () => {
  const sentinelToken = 'SENTINEL_DO_NOT_LEAK_47';
  const execFileSync = (_command, args) => {
    throw new Error(`Command failed: security ${args.join(' ')}`);
  };
  const store = createKeychainCredentialStore({platform: 'darwin', execFileSync});

  assert.throws(
    () => store.write({authToken: sentinelToken}),
    (error) => {
      assert.match(error.message, /OS keychain is required to store/);
      assert.doesNotMatch(error.message, /SENTINEL_DO_NOT_LEAK_47/);
      return true;
    },
  );
});

test('refuses interactive secret storage on unsupported platforms', () => {
  const store = createKeychainCredentialStore({platform: 'linux', execFileSync: () => ''});

  assert.equal(store.read(), null);
  assert.throws(() => store.write({authToken: 'token'}), /OS keychain/);
});
