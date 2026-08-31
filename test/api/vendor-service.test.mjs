import assert from 'node:assert/strict';
import test from 'node:test';

import {fetchMyVendors, fetchVendors} from '../../src/api/services/vendor-service.mjs';

function withPreprodEnv(fn) {
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

test('lists vendors from GET /v1/vendors using the Core envelope', async () => {
  const originalFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (url, options) => {
    request = {url, options};
    return new Response(JSON.stringify({
      data: [
        {id: 'vendor-1', name: 'Serviceplan', slug: 'serviceplan'},
        {id: 'vendor-2', name: 'Acme', slug: 'acme'},
      ],
      meta: {timestamp: '2030-01-01T00:00:00.000Z', requestId: 'req-1'},
    }), {status: 200, headers: {'content-type': 'application/json'}});
  };

  try {
    const {vendors} = await withPreprodEnv(() => fetchVendors());
    assert.equal(request.url, 'https://api.example.test/v1/vendors');
    assert.equal(request.options.headers.authorization, 'Bearer user-token');
    assert.deepEqual(vendors.map((v) => v.id), ['vendor-1', 'vendor-2']);
    assert.equal(vendors[0].name, 'Serviceplan');
  } finally {
    globalThis.fetch = originalFetch;
  }
});


test('lists the caller vendor memberships from GET /v1/vendors/me with role', async () => {
  const originalFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (url, options) => {
    request = {url, options};
    return new Response(JSON.stringify({
      data: [
        {id: 'vendor-1', name: 'Serviceplan', slug: 'serviceplan', role: 'admin'},
      ],
      meta: {timestamp: '2030-01-01T00:00:00.000Z', requestId: 'req-2'},
    }), {status: 200, headers: {'content-type': 'application/json'}});
  };

  try {
    const {vendors} = await withPreprodEnv(() => fetchMyVendors());
    assert.equal(request.url, 'https://api.example.test/v1/vendors/me');
    assert.equal(vendors[0].id, 'vendor-1');
    assert.equal(vendors[0].role, 'admin');
  } finally {
    globalThis.fetch = originalFetch;
  }
});