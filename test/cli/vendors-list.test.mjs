import assert from 'node:assert/strict';
import test from 'node:test';

import {runCli} from '../../src/cli/index.mjs';

function outputBuffer() {
  let value = '';
  return {write(chunk) {value += String(chunk);}, text() {return value;}};
}

test('vendors list prints vendors from GET /v1/vendors', async () => {
  const originalFetch = globalThis.fetch;
  const prevUrl = process.env.SOKOSUMI_API_URL;
  const prevToken = process.env.SOKOSUMI_AUTH_TOKEN;
  const stdout = outputBuffer();
  const stderr = outputBuffer();
  let request;

  process.env.SOKOSUMI_API_URL = 'https://api.example.test';
  process.env.SOKOSUMI_AUTH_TOKEN = 'user-token';
  globalThis.fetch = async (url, options) => {
    request = {url, options};
    return new Response(JSON.stringify({
      data: [{id: 'vendor-1', name: 'Serviceplan', slug: 'serviceplan'}],
      meta: {timestamp: '2030-01-01T00:00:00.000Z', requestId: 'req-1'},
    }), {status: 200, headers: {'content-type': 'application/json'}});
  };

  try {
    const exitCode = await runCli(['vendors', 'list', '--json'], {stdout, stderr, stdin: {isTTY: false}});
    assert.equal(exitCode, 0);
    assert.equal(request.url, 'https://api.example.test/v1/vendors');
    const parsed = JSON.parse(stdout.text());
    assert.deepEqual(parsed.vendors.map((v) => v.id), ['vendor-1']);
  } finally {
    globalThis.fetch = originalFetch;
    if (prevUrl === undefined) delete process.env.SOKOSUMI_API_URL; else process.env.SOKOSUMI_API_URL = prevUrl;
    if (prevToken === undefined) delete process.env.SOKOSUMI_AUTH_TOKEN; else process.env.SOKOSUMI_AUTH_TOKEN = prevToken;
  }
});
