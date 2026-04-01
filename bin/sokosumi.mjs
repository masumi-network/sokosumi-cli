#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import App from '../src/app.mjs';
import {runCli} from '../src/cli/index.mjs';

const argv = process.argv.slice(2);

if (argv.length === 0) {
  render(React.createElement(App));
} else {
  const exitCode = await runCli(argv);
  if (Number.isInteger(exitCode) && exitCode !== 0) {
    process.exit(exitCode);
  }
}

