import assert from 'node:assert/strict';
import test from 'node:test';

import {loginWithBrowser} from '../../src/auth/oauth.mjs';

test('rejects browser OAuth before opening a browser outside macOS', async () => {
  let serverStarted = false;
  let browserOpened = false;

  await assert.rejects(
    loginWithBrowser({
      platform: 'linux',
      authBaseUrl: 'https://api.example.test/auth',
      clientId: 'cli-client',
      serverFactory: () => {
        serverStarted = true;
        throw new Error('Loopback server started');
      },
      openUrl: async () => {
        browserOpened = true;
      },
    }),
    /available on macOS only/,
  );

  assert.equal(serverStarted, false);
  assert.equal(browserOpened, false);
});

test('completes browser OAuth through the loopback callback', async () => {
  let tokenRequest;
  const fetchImpl = async (url, options) => {
    tokenRequest = {url, options};
    return new Response(JSON.stringify({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      token_type: 'Bearer',
      expires_in: 7200,
    }), {status: 200, headers: {'content-type': 'application/json'}});
  };
  const openUrl = async (authorizationUrl) => {
    const authorization = new URL(authorizationUrl);
    const redirectUri = authorization.searchParams.get('redirect_uri');
    const state = authorization.searchParams.get('state');
    setImmediate(() => {
      fetch(`${redirectUri}?code=auth-code&state=${encodeURIComponent(state)}`).catch(() => {});
    });
  };

  const credentials = await loginWithBrowser({
    authBaseUrl: 'https://api.example.test/auth',
    platform: 'darwin',
    clientId: 'cli-client',
    port: 53683,
    openUrl,
    fetchImpl,
    timeoutMs: 5000,
  });

  assert.equal(credentials.authToken, 'access-token');
  assert.equal(credentials.refreshToken, 'refresh-token');
  assert.equal(tokenRequest.url, 'https://api.example.test/auth/oauth2/token');
  const body = new URLSearchParams(tokenRequest.options.body);
  assert.equal(body.get('grant_type'), 'authorization_code');
  assert.equal(body.get('code'), 'auth-code');
  assert.ok(body.get('code_verifier'));
});
