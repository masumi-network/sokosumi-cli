import assert from 'node:assert/strict';
import test from 'node:test';

import {createCoworker, updateCoworker} from '../../src/api/services/coworker-service.mjs';

function stubFetch(captured) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    captured.url = url;
    captured.options = options;
    return new Response(JSON.stringify({
      data: {id: 'cow-1', name: 'Ops Agent'},
      meta: {timestamp: '2030-01-01T00:00:00.000Z', requestId: 'req-1'},
    }), {status: 201, headers: {'content-type': 'application/json'}});
  };
  return () => {
    globalThis.fetch = originalFetch;
  };
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
      if (prevUrl === undefined) delete process.env.SOKOSUMI_API_URL;
      else process.env.SOKOSUMI_API_URL = prevUrl;
      if (prevToken === undefined) delete process.env.SOKOSUMI_AUTH_TOKEN;
      else process.env.SOKOSUMI_AUTH_TOKEN = prevToken;
    }
  })();
}

test('create sends vendorId in the coworker payload', async () => {
  const captured = {};
  const restore = stubFetch(captured);
  try {
    await withEnv(() => createCoworker({name: 'Ops Agent', vendorId: 'vendor-1'}));
    assert.equal(captured.url, 'https://api.example.test/v1/coworkers');
    const body = JSON.parse(captured.options.body);
    assert.equal(body.vendorId, 'vendor-1');
    assert.equal(body.name, 'Ops Agent');
  } finally {
    restore();
  }
});

test('patch never sends vendorId even if supplied', async () => {
  const captured = {};
  const restore = stubFetch(captured);
  try {
    await withEnv(() => updateCoworker('cow-1', {name: 'Ops Agent v2', vendorId: 'vendor-1'}));
    const body = JSON.parse(captured.options.body);
    assert.equal(body.name, 'Ops Agent v2');
    assert.equal('vendorId' in body, false);
  } finally {
    restore();
  }
});
