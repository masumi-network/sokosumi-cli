export function parseArgs(argv) {
  const args = {_: []};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === '-h' || token === '--help') {
      args.help = true;
      continue;
    }

    if (!token.startsWith('--')) {
      args._.push(token);
      continue;
    }

    const equalsIndex = token.indexOf('=');
    let key;
    let value;

    if (equalsIndex >= 0) {
      key = token.slice(2, equalsIndex);
      value = token.slice(equalsIndex + 1);
    } else {
      key = token.slice(2);
      const next = argv[index + 1];
      if (next && !next.startsWith('--')) {
        value = next;
        index += 1;
      } else {
        value = true;
      }
    }

    if (args[key] === undefined) {
      args[key] = value;
    } else if (Array.isArray(args[key])) {
      args[key].push(value);
    } else {
      args[key] = [args[key], value];
    }
  }

  return args;
}

export function asArray(value) {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

export function getOption(args, ...names) {
  for (const name of names) {
    if (args[name] !== undefined) {
      return args[name];
    }
  }

  return undefined;
}
