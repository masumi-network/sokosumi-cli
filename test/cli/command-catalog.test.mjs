import assert from 'node:assert/strict';
import test from 'node:test';

import {runCli} from '../../src/cli/index.mjs';

function outputBuffer() {
  let value = '';
  return {write(chunk) {value += String(chunk);}, text() {return value;}};
}

// Every command the CLI implements must appear in both discovery surfaces.
const REQUIRED_COMMANDS = [
  'agents list',
  'agents hire',
  'vendors list',
  'vendors me',
  'coworkers list',
  'coworkers connect',
  'coworkers register',
  'coworkers update',
  'coworkers api-key',
  'coworkers me',
  'tasks list',
  'tasks create',
  'tasks get',
  'tasks events',
  'tasks jobs',
  'tasks comment',
  'jobs list',
  'jobs get',
];

test('help lists every implemented command', async () => {
  const stdout = outputBuffer();
  const stderr = outputBuffer();
  await runCli(['--help'], {stdout, stderr, stdin: {isTTY: false}});
  const text = stdout.text();
  for (const command of REQUIRED_COMMANDS) {
    assert.ok(text.includes(command), `help is missing "${command}"`);
  }
});

test('discover json and text catalogs list every implemented command', async () => {
  const originalFetch = globalThis.fetch;
  const prevUrl = process.env.SOKOSUMI_API_URL;
  const prevToken = process.env.SOKOSUMI_AUTH_TOKEN;
  process.env.SOKOSUMI_API_URL = 'https://api.example.test';
  process.env.SOKOSUMI_AUTH_TOKEN = 'user-token';
  globalThis.fetch = async () => new Response(JSON.stringify({
    data: [],
    meta: {timestamp: '2030-01-01T00:00:00.000Z', requestId: 'req-1'},
  }), {status: 200, headers: {'content-type': 'application/json'}});

  try {
    const jsonOut = outputBuffer();
    await runCli(['discover', '--json'], {stdout: jsonOut, stderr: outputBuffer(), stdin: {isTTY: false}});
    const parsed = JSON.parse(jsonOut.text());
    for (const command of REQUIRED_COMMANDS) {
      assert.ok(parsed.commands.includes(command), `discover json is missing "${command}"`);
    }

    const textOut = outputBuffer();
    await runCli(['discover'], {stdout: textOut, stderr: outputBuffer(), stdin: {isTTY: false}});
    const text = textOut.text();
    for (const command of REQUIRED_COMMANDS) {
      assert.ok(text.includes(command), `discover text is missing "${command}"`);
    }
  } finally {
    globalThis.fetch = originalFetch;
    if (prevUrl === undefined) delete process.env.SOKOSUMI_API_URL; else process.env.SOKOSUMI_API_URL = prevUrl;
    if (prevToken === undefined) delete process.env.SOKOSUMI_AUTH_TOKEN; else process.env.SOKOSUMI_AUTH_TOKEN = prevToken;
  }
});
