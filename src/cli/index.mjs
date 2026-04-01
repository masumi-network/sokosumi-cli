import fsPromises from 'fs/promises';
import {
  createAgentJob,
  createCoworker,
  createCoworkerApiKey,
  fetchAgentInputSchema,
  fetchAgents,
  fetchCoworkers,
  fetchCurrentCoworker,
  fetchJob,
  fetchJobs
} from '../api/index.mjs';
import {loadEnvFromLocalFile} from '../utils/env.mjs';
import {asArray, getOption, parseArgs} from './args.mjs';

const HELP_TEXT = `Sokosumi CLI

Usage:
  sokosumi
  sokosumi agents list [--search QUERY] [--limit N] [--json]
  sokosumi agents hire <agent-id> (--input-json JSON | --input-file PATH) [--name JOB_NAME] [--max-credits N] [--json]
  sokosumi coworkers list [--search QUERY] [--limit N] [--scope whitelisted|all|archived] [--capability chat|tasks] [--json]
  sokosumi coworkers register --name NAME [--caption TEXT] [--company NAME] [--company-logo URL] [--url URL] [--base-url URL] [--description TEXT] [--image URL] [--priority N] [--capability chat|tasks] [--channel PROVIDER=VALUE] [--metadata-json JSON | --metadata-file PATH] [--create-api-key] [--api-key-name NAME] [--api-key-expires-at ISO] [--json]
  sokosumi coworkers api-key <coworker-id> [--name KEY_NAME] [--expires-at ISO] [--json]
  sokosumi coworkers me [--json]
  sokosumi jobs list [--limit N] [--json]
  sokosumi jobs get <job-id> [--json]

Global options:
  --api-key KEY
  --auth-token TOKEN
  --api-url URL
  --json
  -h, --help
`;

function truncate(value, max = 100) {
  const text = String(value ?? '').trim();
  if (!text) return '';
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}...`;
}

function parsePositiveInteger(value, {label} = {}) {
  if (value === undefined) return undefined;
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label || 'value'} must be a positive integer`);
  }
  return parsed;
}

function parseInteger(value, {label} = {}) {
  if (value === undefined) return undefined;
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed)) {
    throw new Error(`${label || 'value'} must be an integer`);
  }
  return parsed;
}

function normalizeCapabilities(input) {
  return asArray(input)
    .flatMap(value => String(value).split(','))
    .map(value => value.trim())
    .filter(Boolean);
}

function normalizeSearch(text) {
  return String(text || '').trim().toLowerCase();
}

function applyListFilters(items, {search, limit, fields}) {
  const needle = normalizeSearch(search);
  let filtered = items;

  if (needle) {
    filtered = filtered.filter(item => {
      const haystack = fields(item)
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }

  if (Number.isInteger(limit) && limit > 0) {
    filtered = filtered.slice(0, limit);
  }

  return filtered;
}

function parseChannels(input) {
  const entries = {};

  for (const item of asArray(input)) {
    const text = String(item);
    const separator = text.indexOf('=');
    if (separator <= 0 || separator === text.length - 1) {
      throw new Error(`Invalid --channel value "${text}". Use provider=value.`);
    }

    const provider = text.slice(0, separator).trim();
    const value = text.slice(separator + 1).trim();

    if (!provider || !value) {
      throw new Error(`Invalid --channel value "${text}". Use provider=value.`);
    }

    entries[provider] = value;
  }

  return entries;
}

async function readJsonObject({jsonText, filePath, label}) {
  if (jsonText && filePath) {
    throw new Error(`Pass either ${label}-json or ${label}-file, not both`);
  }

  if (!jsonText && !filePath) {
    return {};
  }

  const source = filePath
    ? await fsPromises.readFile(String(filePath), 'utf8')
    : String(jsonText);

  let parsed;
  try {
    parsed = JSON.parse(source);
  } catch (error) {
    throw new Error(`Failed to parse ${label} JSON: ${error.message}`);
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON object`);
  }

  return parsed;
}

async function readOptionalJsonObject({jsonText, filePath, label}) {
  if (!jsonText && !filePath) {
    return undefined;
  }

  return readJsonObject({jsonText, filePath, label});
}

function applyRuntimeOverrides(args) {
  loadEnvFromLocalFile();

  const apiUrl = getOption(args, 'api-url');
  const apiKey = getOption(args, 'api-key');
  const authToken = getOption(args, 'auth-token');

  if (typeof apiUrl === 'string' && apiUrl.trim()) {
    process.env.SOKOSUMI_API_URL = apiUrl.trim();
  }

  if (typeof apiKey === 'string' && apiKey.trim()) {
    process.env.SOKOSUMI_API_KEY = apiKey.trim();
  }

  if (typeof authToken === 'string' && authToken.trim()) {
    process.env.SOKOSUMI_AUTH_TOKEN = authToken.trim();
  }
}

function isJsonOutput(args) {
  return Boolean(args.json);
}

function writeJson(stdout, payload) {
  stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

function writeText(stdout, lines) {
  stdout.write(`${lines.filter(Boolean).join('\n')}\n`);
}

function buildErrorPayload(error) {
  return {
    error: {
      message: error?.message || 'Unknown error',
      status: error?.status ?? null,
      body: error?.body ?? null
    }
  };
}

function printAgentList(stdout, agents) {
  if (agents.length === 0) {
    writeText(stdout, ['No agents matched.']);
    return;
  }

  const lines = ['Agents'];
  for (const agent of agents) {
    const tags = (agent.tags || []).map(tag => tag.name).filter(Boolean).join(', ');
    const price = agent?.price?.credits != null ? `${agent.price.credits} credits` : 'price n/a';
    lines.push(`${agent.name || 'Unnamed Agent'} [${agent.id}]`);
    lines.push(`  status: ${agent.status || 'unknown'} | ${price}`);
    if (tags) lines.push(`  tags: ${tags}`);
    if (agent.description) lines.push(`  description: ${truncate(agent.description, 140)}`);
  }

  writeText(stdout, lines);
}

function printCoworkerList(stdout, coworkers) {
  if (coworkers.length === 0) {
    writeText(stdout, ['No coworkers matched.']);
    return;
  }

  const lines = ['Coworkers'];
  for (const coworker of coworkers) {
    const capabilities = Array.isArray(coworker.capabilities) && coworker.capabilities.length > 0
      ? coworker.capabilities.join(', ')
      : 'none';
    lines.push(`${coworker.name || 'Unnamed Coworker'} [${coworker.id}]`);
    lines.push(`  capabilities: ${capabilities}`);
    if (coworker.company) lines.push(`  company: ${coworker.company}`);
    if (coworker.baseURL) lines.push(`  baseURL: ${coworker.baseURL}`);
    if (coworker.metadata?.channels && Object.keys(coworker.metadata.channels).length > 0) {
      const channels = Object.entries(coworker.metadata.channels)
        .map(([provider, value]) => `${provider}=${value}`)
        .join(', ');
      lines.push(`  channels: ${channels}`);
    }
    if (coworker.description) lines.push(`  description: ${truncate(coworker.description, 140)}`);
  }

  writeText(stdout, lines);
}

function printJobList(stdout, jobs) {
  if (jobs.length === 0) {
    writeText(stdout, ['No jobs found.']);
    return;
  }

  const lines = ['Jobs'];
  for (const job of jobs) {
    lines.push(`${job.name || job.id} [${job.id}]`);
    lines.push(`  status: ${job.status || 'unknown'} | agent: ${job.agentId || '-'}`);
    if (job.result) lines.push(`  result: ${truncate(job.result, 160)}`);
  }

  writeText(stdout, lines);
}

function printJob(stdout, job) {
  writeText(stdout, [
    `Job ${job.id}`,
    `status: ${job.status || 'unknown'}`,
    `agent: ${job.agentId || '-'}`,
    job.name ? `name: ${job.name}` : '',
    job.credits != null ? `credits: ${job.credits}` : '',
    job.result ? `result: ${job.result}` : '',
    job.output ? `output: ${job.output}` : ''
  ]);
}

function printCoworkerRegistration(stdout, coworker, apiKey) {
  const lines = [
    `Created coworker ${coworker.name || coworker.id} [${coworker.id}]`,
    coworker.slug ? `slug: ${coworker.slug}` : '',
    coworker.baseURL ? `baseURL: ${coworker.baseURL}` : '',
    Number.isInteger(coworker.priority) ? `priority: ${coworker.priority}` : '',
    Array.isArray(coworker.capabilities) && coworker.capabilities.length > 0
      ? `capabilities: ${coworker.capabilities.join(', ')}`
      : ''
  ];

  if (coworker.metadata?.channels && Object.keys(coworker.metadata.channels).length > 0) {
    const channels = Object.entries(coworker.metadata.channels)
      .map(([provider, value]) => `${provider}=${value}`)
      .join(', ');
    lines.push(`channels: ${channels}`);
  }

  if (apiKey?.token) {
    lines.push(`coworker api key: ${apiKey.token}`);
    lines.push('Store this token securely. It is only returned once.');
  }

  writeText(stdout, lines);
}

function printCoworkerApiKey(stdout, coworkerId, apiKey) {
  writeText(stdout, [
    `Created API key for coworker ${coworkerId}`,
    apiKey.name ? `name: ${apiKey.name}` : '',
    apiKey.expiresAt ? `expiresAt: ${apiKey.expiresAt.toISOString()}` : '',
    `token: ${apiKey.token}`,
    'Store this token securely. It is only returned once.'
  ]);
}

async function buildCoworkerCreatePayload(args) {
  const metadata = await readOptionalJsonObject({
    jsonText: getOption(args, 'metadata-json'),
    filePath: getOption(args, 'metadata-file'),
    label: 'metadata'
  });
  const channels = parseChannels(getOption(args, 'channel'));
  const mergedMetadata = (() => {
    const base = metadata && typeof metadata === 'object' && !Array.isArray(metadata)
      ? metadata
      : undefined;
    const existingChannels = base?.channels && typeof base.channels === 'object' && !Array.isArray(base.channels)
      ? base.channels
      : undefined;
    const nextChannels = {
      ...(existingChannels || {}),
      ...channels
    };

    if (base || Object.keys(nextChannels).length > 0) {
      return {
        ...(base || {}),
        ...(Object.keys(nextChannels).length > 0 ? {channels: nextChannels} : {})
      };
    }

    return undefined;
  })();

  return {
    name: getOption(args, 'name'),
    caption: getOption(args, 'caption'),
    company: getOption(args, 'company'),
    companyLogo: getOption(args, 'company-logo'),
    url: getOption(args, 'url'),
    baseURL: getOption(args, 'base-url'),
    description: getOption(args, 'description'),
    image: getOption(args, 'image'),
    priority: parseInteger(getOption(args, 'priority'), {label: '--priority'}),
    capabilities: normalizeCapabilities(getOption(args, 'capability', 'capabilities')),
    metadata: mergedMetadata
  };
}

async function handleAgentsCommand(args, io) {
  const subcommand = args._[1];
  const jsonOutput = isJsonOutput(args);

  if (!subcommand || subcommand === 'list') {
    const limit = parsePositiveInteger(getOption(args, 'limit'), {label: '--limit'});
    const {agents} = await fetchAgents();
    const filtered = applyListFilters(agents, {
      search: getOption(args, 'search'),
      limit,
      fields: (agent) => [agent.id, agent.name, agent.description, ...(agent.tags || []).map(tag => tag.name)]
    });

    if (jsonOutput) {
      writeJson(io.stdout, {agents: filtered});
    } else {
      printAgentList(io.stdout, filtered);
    }
    return 0;
  }

  if (subcommand === 'hire') {
    const agentId = args._[2] || getOption(args, 'agent');
    if (!agentId) {
      throw new Error('agent id is required for `agents hire`');
    }

    const inputData = await readJsonObject({
      jsonText: getOption(args, 'input-json'),
      filePath: getOption(args, 'input-file'),
      label: 'input'
    });

    const maxCredits = parsePositiveInteger(getOption(args, 'max-credits'), {label: '--max-credits'});
    const {schema} = await fetchAgentInputSchema(agentId);
    const {job} = await createAgentJob(agentId, {
      inputSchema: schema,
      inputData,
      maxCredits,
      name: getOption(args, 'name')
    });

    if (jsonOutput) {
      writeJson(io.stdout, {job});
    } else {
      writeText(io.stdout, [
        `Created job ${job.id}`,
        `agent: ${job.agentId || agentId}`,
        `status: ${job.status || 'unknown'}`
      ]);
    }
    return 0;
  }

  throw new Error(`Unknown agents subcommand: ${subcommand}`);
}

async function handleCoworkersCommand(args, io) {
  const subcommand = args._[1];
  const jsonOutput = isJsonOutput(args);

  if (!subcommand || subcommand === 'list') {
    const limit = parsePositiveInteger(getOption(args, 'limit'), {label: '--limit'});
    const {coworkers} = await fetchCoworkers({
      scope: getOption(args, 'scope'),
      capabilities: normalizeCapabilities(getOption(args, 'capability', 'capabilities'))
    });

    const filtered = applyListFilters(coworkers, {
      search: getOption(args, 'search'),
      limit,
      fields: (coworker) => [
        coworker.id,
        coworker.slug,
        coworker.name,
        coworker.company,
        coworker.caption,
        coworker.description,
        ...(coworker.capabilities || [])
      ]
    });

    if (jsonOutput) {
      writeJson(io.stdout, {coworkers: filtered});
    } else {
      printCoworkerList(io.stdout, filtered);
    }
    return 0;
  }

  if (subcommand === 'register') {
    const payload = await buildCoworkerCreatePayload(args);
    const shouldCreateApiKey = Boolean(getOption(args, 'create-api-key', 'with-api-key'));
    const {coworker} = await createCoworker(payload);

    let apiKey = null;
    if (shouldCreateApiKey) {
      const apiKeyResult = await createCoworkerApiKey(coworker.id, {
        name: getOption(args, 'api-key-name'),
        expiresAt: getOption(args, 'api-key-expires-at')
      });
      apiKey = apiKeyResult.apiKey;
    }

    if (jsonOutput) {
      writeJson(io.stdout, {coworker, apiKey});
    } else {
      printCoworkerRegistration(io.stdout, coworker, apiKey);
    }
    return 0;
  }

  if (subcommand === 'api-key') {
    const coworkerId = args._[2] || getOption(args, 'id', 'coworker-id');
    if (!coworkerId) {
      throw new Error('coworker id is required for `coworkers api-key`');
    }

    const {apiKey} = await createCoworkerApiKey(coworkerId, {
      name: getOption(args, 'name', 'api-key-name'),
      expiresAt: getOption(args, 'expires-at', 'api-key-expires-at')
    });

    if (jsonOutput) {
      writeJson(io.stdout, {coworkerId, apiKey});
    } else {
      printCoworkerApiKey(io.stdout, coworkerId, apiKey);
    }
    return 0;
  }

  if (subcommand === 'me') {
    const {coworker} = await fetchCurrentCoworker();
    if (jsonOutput) {
      writeJson(io.stdout, {coworker});
    } else {
      writeText(io.stdout, [
        `${coworker.name || 'Unnamed Coworker'} [${coworker.id}]`,
        coworker.baseURL ? `baseURL: ${coworker.baseURL}` : '',
        Array.isArray(coworker.capabilities) && coworker.capabilities.length > 0
          ? `capabilities: ${coworker.capabilities.join(', ')}`
          : '',
        coworker.metadata?.channels && Object.keys(coworker.metadata.channels).length > 0
          ? `channels: ${Object.entries(coworker.metadata.channels).map(([provider, value]) => `${provider}=${value}`).join(', ')}`
          : ''
      ]);
    }
    return 0;
  }

  throw new Error(`Unknown coworkers subcommand: ${subcommand}`);
}

async function handleJobsCommand(args, io) {
  const subcommand = args._[1];
  const jsonOutput = isJsonOutput(args);

  if (!subcommand || subcommand === 'list') {
    const limit = parsePositiveInteger(getOption(args, 'limit'), {label: '--limit'});
    const {jobs} = await fetchJobs();
    const filtered = Number.isInteger(limit) ? jobs.slice(0, limit) : jobs;

    if (jsonOutput) {
      writeJson(io.stdout, {jobs: filtered});
    } else {
      printJobList(io.stdout, filtered);
    }
    return 0;
  }

  if (subcommand === 'get') {
    const jobId = args._[2] || getOption(args, 'id', 'job-id');
    if (!jobId) {
      throw new Error('job id is required for `jobs get`');
    }

    const {job} = await fetchJob(jobId);

    if (jsonOutput) {
      writeJson(io.stdout, {job});
    } else {
      printJob(io.stdout, job);
    }
    return 0;
  }

  throw new Error(`Unknown jobs subcommand: ${subcommand}`);
}

export async function runCli(argv, io = {}) {
  const stdout = io.stdout || process.stdout;
  const stderr = io.stderr || process.stderr;
  const args = parseArgs(argv);

  if (args.help) {
    writeText(stdout, [HELP_TEXT.trimEnd()]);
    return 0;
  }

  applyRuntimeOverrides(args);

  const command = args._[0];
  if (!command) {
    writeText(stdout, [HELP_TEXT.trimEnd()]);
    return 0;
  }

  try {
    if (command === 'agents') {
      return await handleAgentsCommand(args, {stdout, stderr});
    }

    if (command === 'coworkers') {
      return await handleCoworkersCommand(args, {stdout, stderr});
    }

    if (command === 'jobs') {
      return await handleJobsCommand(args, {stdout, stderr});
    }

    if (command === 'help') {
      writeText(stdout, [HELP_TEXT.trimEnd()]);
      return 0;
    }

    throw new Error(`Unknown command: ${command}`);
  } catch (error) {
    if (isJsonOutput(args)) {
      writeJson(stdout, buildErrorPayload(error));
    } else {
      writeText(stderr, [
        `Error: ${error?.message || 'Unknown error'}`,
        error?.status ? `status: ${error.status}` : '',
        error?.body ? `body: ${typeof error.body === 'string' ? error.body : JSON.stringify(error.body)}` : ''
      ]);
    }
    return 1;
  }
}
