async function readAll(input) {
  const chunks = [];
  for await (const chunk of input) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
  }
  return Buffer.concat(chunks).toString('utf8').trim();
}

function promptSecret({stdin, stdout, prompt}) {
  if (typeof stdin.setRawMode !== 'function') {
    throw new Error('Interactive secret input requires a TTY; use SOKOSUMI_PROVIDER_API_KEY or --provider-api-key-stdin');
  }

  return new Promise((resolve, reject) => {
    let value = '';
    let settled = false;
    const finish = (callback, result) => {
      if (settled) return;
      settled = true;
      stdin.off?.('data', onData);
      stdin.setRawMode(false);
      stdin.pause?.();
      stdout.write('\n');
      callback(result);
    };
    const onData = (chunk) => {
      const text = String(chunk);
      for (const character of text) {
        if (character === '\u0003') {
          finish(reject, new Error('Secret input was cancelled'));
          return;
        }
        if (character === '\r' || character === '\n') {
          const secret = value.trim();
          if (!secret) {
            finish(reject, new Error('Provider API key cannot be empty'));
          } else {
            finish(resolve, secret);
          }
          return;
        }
        if (character === '\u0008' || character === '\u007f') {
          value = value.slice(0, -1);
          continue;
        }
        value += character;
      }
    };

    try {
      stdout.write(prompt);
      stdin.setRawMode(true);
      stdin.resume?.();
      stdin.setEncoding?.('utf8');
      stdin.on('data', onData);
    } catch (error) {
      finish(reject, error);
    }
  });
}

export async function resolveSecret({
  env = process.env,
  envName,
  fromStdin = false,
  jsonOutput = false,
  stdin = process.stdin,
  stdout = process.stderr,
  prompt = 'Provider API key: ',
} = {}) {
  const configured = typeof env?.[envName] === 'string' ? env[envName].trim() : '';
  if (configured) return configured;

  if (fromStdin) {
    const value = await readAll(stdin);
    if (!value) throw new Error(`${envName} from stdin was empty`);
    return value;
  }

  if (jsonOutput || !stdin.isTTY) {
    throw new Error(
      `Set ${envName} or pass --provider-api-key-stdin; the provider key is never accepted as a command-line argument`,
    );
  }

  return promptSecret({stdin, stdout, prompt});
}
