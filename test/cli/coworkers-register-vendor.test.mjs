import assert from 'node:assert/strict';
import test from 'node:test';

import {runCli} from '../../src/cli/index.mjs';

function outputBuffer() {
  let value = '';
  return {write(chunk) {value += String(chunk);}, text() {return value;}};
}

function withEnv(fn) {
  const prevUrl = process.env.SOKOSUMI_API_URL;
  const prevToken = process.env.SOKOSUMI_AUTH_TOKEN;
  process.env.SOKOSUMI_API_URL = 'https://api.example.test';
  process.env.SOKOSUMI_AUTH_TOKEN = 'user-token';
  return (async () => {
    try {
      return await fn();
    } finally {
      if (prevUrl === undefined) delete process.env.SOKOSUMI_API_URL; else process.env.SOKOSUMI_API_URL = prevUrl;
      if (prevToken === undefined) delete process.env.SOKOSUMI_AUTH_TOKEN; else process.env.SOKOSUMI_AUTH_TOKEN = prevToken;
    }
  })();
}

test('register sends vendorId in the create request', async () => {
  const originalFetch = globalThis.fetch;
  const stdout = outputBuffer();
  const stderr = outputBuffer();
  let request;
  globalThis.fetch = async (url, options) => {
    request = {url, options};
    return new Response(JSON.stringify({
      data: {id: 'cow-1', name: 'Fresh Agent', vendorId: 'vendor-1'},
      meta: {timestamp: '2030-01-01T00:00:00.000Z', requestId: 'req-1'},
    }), {status: 201, headers: {'content-type': 'application/json'}});
  };

  try {
    const exitCode = await withEnv(() => runCli(
      ['coworkers', 'register', '--name', 'Fresh Agent', '--vendor-id', 'vendor-1', '--json'],
      {stdout, stderr, stdin: {isTTY: false}},
    ));
    assert.equal(exitCode, 0);
    assert.equal(request.url, 'https://api.example.test/v1/coworkers');
    const body = JSON.parse(request.options.body);
    assert.equal(body.vendorId, 'vendor-1');
    assert.equal(body.name, 'Fresh Agent');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('register without a vendor id fails before any request', async () => {
  const originalFetch = globalThis.fetch;
  const stdout = outputBuffer();
  const stderr = outputBuffer();
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return new Response('{}', {status: 200, headers: {'content-type': 'application/json'}});
  };

  try {
    const exitCode = await withEnv(() => runCli(
      ['coworkers', 'register', '--name', 'Fresh Agent', '--json'],
      {stdout, stderr, stdin: {isTTY: false}},
    ));
    assert.equal(exitCode, 1);
    assert.equal(called, false);
    assert.match(stdout.text(), /vendor/i);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
