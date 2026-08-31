import {createRequire} from 'module';
import {randomUUID} from 'node:crypto';
import fsPromises from 'fs/promises';
import {
  createTask,
  createTaskEvent,
  createAgentJob,
  createCoworker,
  connectCoworker,
  createCoworkerApiKey,
  fetchAgentInputSchema,
  fetchAgents,
  fetchCoworkers,
  fetchCurrentCoworker,
  fetchJob,
  fetchJobEvents,
  fetchJobFiles,
  fetchJobInputRequest,
  fetchJobLinks,
  fetchJobs,
  fetchVendors,
  fetchMyVendors,
  fetchTask,
  fetchTaskEvents,
  fetchTaskJobs,
  fetchTasks,
  updateCoworker
} from '../api/index.mjs';

import {loadEnvFromLocalFile, DEFAULT_API_URL, PREPROD_API_URL} from '../utils/env.mjs';
import {normalizeCapabilities} from '../utils/normalize.mjs';
import {resolveSecret} from '../utils/secret-input.mjs';
import {asArray, getOption, parseArgs} from './args.mjs';

const require = createRequire(import.meta.url);
const {version: CLI_VERSION} = require('../../package.json');

const VALID_CAPABILITIES = ['chat', 'tasks'];

const HELP_TEXT = `Sokosumi CLI v${CLI_VERSION}

Usage:
  sokosumi
  sokosumi discover [--json]
  sokosumi agents list [--search QUERY] [--limit N] [--json]
  sokosumi agents hire <agent-id> (--input-json JSON | --input-file PATH) [--name JOB_NAME] [--max-credits N] [--json]
  sokosumi vendors list [--json]
  sokosumi vendors me [--json]
  sokosumi coworkers list [--search QUERY] [--limit N] [--scope whitelisted|all|archived] [--capability chat|tasks] [--json]
  sokosumi coworkers connect <coworker-id> --organization-id ID --base-url HTTPS_URL [--idempotency-key KEY] [--provider-api-key-stdin] [--json]
  sokosumi coworkers register --name NAME --vendor-id VENDOR_ID [--caption TEXT] [--url URL] [--base-url URL] [--description TEXT] [--priority N] [--capability chat|tasks] [--channel PROVIDER=VALUE] [--metadata-json JSON | --metadata-file PATH] [--create-api-key] [--api-key-name NAME] [--api-key-expires-at ISO] [--json]
  sokosumi coworkers update <coworker-id> [--name NAME] [--caption TEXT] [--company NAME] [--company-logo URL] [--url URL] [--base-url URL] [--description TEXT] [--image URL] [--priority N] [--capability chat|tasks] [--channel PROVIDER=VALUE] [--metadata-json JSON | --metadata-file PATH] [--json]
  sokosumi coworkers api-key <coworker-id> [--name KEY_NAME] [--expires-at ISO] [--json]
  sokosumi coworkers me [--json]
  sokosumi tasks list [--search QUERY] [--limit N] [--status STATUS] [--scope owned|workspace] [--coworker-id ID] [--json]
  sokosumi tasks create --coworker-id ID --description TEXT [--name TASK_NAME] [--status READY|DRAFT] [--json]
  sokosumi tasks get <task-id> [--json]
  sokosumi tasks events <task-id> [--json]
  sokosumi tasks jobs <task-id> [--json]
  sokosumi tasks comment <task-id> (--comment TEXT | --status STATUS) [--json]
  sokosumi jobs list [--limit N] [--json]
  sokosumi jobs get <job-id> [--details] [--json]

Global options:
  --api-key KEY
  --auth-token TOKEN
  --api-url URL         override API base URL (default: https://api.sokosumi.com)
  --preprod             use preprod environment (https://api.preprod.sokosumi.com)
  --json
  -h, --help
  -v, --version

Environments:
  mainnet (default)  https://api.sokosumi.com
  preprod (testing)  https://api.preprod.sokosumi.com
`;

const TASK_CREATE_STATUSES = ['DRAFT', 'READY'];

function validateCapabilities(capabilities) {
  for (const cap of capabilities) {
    if (!VALID_CAPABILITIES.includes(cap)) {
      throw new Error(`Invalid capability "${cap}". Allowed values: ${VALID_CAPABILITIES.join(', ')}`);
    }
  }
  return capabilities;
}

function truncate(value, max = 100) {
  const text = String(value ?? '').trim();
  if (!text) return '';
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

// parsePositiveInteger: for --limit, --max-credits (must be > 0)
// parseInteger: for --priority (allows negative/zero values)
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

function parseTaskCreateStatus(value) {
  if (value === undefined) return undefined;
  const status = String(value).trim().toUpperCase();
  if (!TASK_CREATE_STATUSES.includes(status)) {
    throw new Error(`--status must be one of: ${TASK_CREATE_STATUSES.join(', ')}`);
  }
  return status;
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
  const preprod = args.preprod === true || args.preprod === 'true';

  // --api-url takes highest priority, then --preprod, then env/config
  if (typeof apiUrl === 'string' && apiUrl.trim()) {
    process.env.SOKOSUMI_API_URL = apiUrl.trim();
  } else if (preprod) {
    process.env.SOKOSUMI_API_URL = PREPROD_API_URL;
  }

  if (typeof apiKey === 'string' && apiKey.trim()) {
    process.env.SOKOSUMI_API_KEY = apiKey.trim();
  }

  if (typeof authToken === 'string' && authToken.trim()) {
    process.env.SOKOSUMI_AUTH_TOKEN = authToken.trim();
  }
}

function isJsonOutput(args) {
  return args.json === true || args.json === 'true';
}

async function resolveProviderApiKey(args, io) {
  if (getOption(args, 'provider-api-key') !== undefined) {
    throw new Error(
      'Provider API key must come from SOKOSUMI_PROVIDER_API_KEY, --provider-api-key-stdin, or the hidden TTY prompt',
    );
  }

  return resolveSecret({
    env: process.env,
    envName: 'SOKOSUMI_PROVIDER_API_KEY',
    fromStdin: Boolean(getOption(args, 'provider-api-key-stdin')),
    jsonOutput: isJsonOutput(args),
    stdin: io.stdin || process.stdin,
    stdout: io.stderr || process.stderr,
  });
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

function formatDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function printJob(stdout, job, details = {}) {
  const lines = [
    `Job ${job.id}`,
    `status: ${job.status || 'unknown'}`,
    `agent: ${job.agentId || '-'}`,
    job.name ? `name: ${job.name}` : '',
    job.credits != null ? `credits: ${job.credits}` : '',
    job.result ? `result: ${job.result}` : '',
    job.output ? `output: ${job.output}` : ''
  ];

  if (details.inputRequest) {
    lines.push('input request: pending');
  }

  if (Array.isArray(details.events) && details.events.length > 0) {
    lines.push(`events: ${details.events.length}`);
    const latest = details.events[details.events.length - 1];
    lines.push(`latest event: ${truncate(latest.message || latest.type || latest.id, 160)}`);
  }

  if (Array.isArray(details.files) && details.files.length > 0) {
    lines.push(`files: ${details.files.length}`);
    for (const file of details.files.slice(0, 3)) {
      lines.push(`  ${file.name || file.id || 'file'}: ${file.url || '-'}`);
    }
  }

  if (Array.isArray(details.links) && details.links.length > 0) {
    lines.push(`links: ${details.links.length}`);
    for (const link of details.links.slice(0, 3)) {
      lines.push(`  ${link.title || link.id || 'link'}: ${link.url || '-'}`);
    }
  }

  if (Array.isArray(details.detailsErrors) && details.detailsErrors.length > 0) {
    lines.push(`detail errors: ${details.detailsErrors.map(err => err.resource).join(', ')}`);
  }

  writeText(stdout, lines);
}

function printTaskList(stdout, tasks) {
  if (tasks.length === 0) {
    writeText(stdout, ['No tasks found.']);
    return;
  }

  const lines = ['Tasks'];
  for (const task of tasks) {
    lines.push(`${task.name || task.id} [${task.id}]`);
    lines.push(`  status: ${task.status || 'unknown'} | coworker: ${task.coworkerName || task.coworkerId || '-'}`);
    if (task.updatedAt) lines.push(`  updated: ${formatDate(task.updatedAt)}`);
  }

  writeText(stdout, lines);
}

function printTask(stdout, task, details = {}) {
  writeText(stdout, [
    `Task ${task.id}`,
    `status: ${task.status || 'unknown'}`,
    `coworker: ${task.coworkerName || task.coworkerId || '-'}`,
    task.name ? `name: ${task.name}` : '',
    task.description ? `description: ${truncate(task.description, 240)}` : '',
    task.totalCredits != null ? `credits: ${task.totalCredits}` : '',
    Array.isArray(details.jobs) ? `jobs: ${details.jobs.length}` : '',
    Array.isArray(details.events) ? `events: ${details.events.length}` : '',
    Array.isArray(details.events) && details.events.length > 0
      ? `latest event: ${truncate(details.events[details.events.length - 1]?.comment || details.events[details.events.length - 1]?.message || details.events[details.events.length - 1]?.status || details.events[details.events.length - 1]?.id, 160)}`
      : '',
    Array.isArray(details.detailsErrors) && details.detailsErrors.length > 0
      ? `detail errors: ${details.detailsErrors.map(err => err.resource).join(', ')}`
      : ''
  ]);
}

function printEvents(stdout, events) {
  if (events.length === 0) {
    writeText(stdout, ['No events found.']);
    return;
  }

  const lines = ['Events'];
  for (const event of events) {
    lines.push(`${event.id || '(event)'}`);
    if (event.createdAt) lines.push(`  created: ${formatDate(event.createdAt)}`);
    if (event.status) lines.push(`  status: ${event.status}`);
    if (event.type) lines.push(`  type: ${event.type}`);
    if (event.comment || event.message) lines.push(`  ${truncate(event.comment || event.message, 220)}`);
  }

  writeText(stdout, lines);
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
    const masked = `${apiKey.token.slice(0, 8)}..${apiKey.token.slice(-4)}`;
    lines.push(`coworker api key: ${masked}`);
    lines.push('WARNING: Token is partially masked in text output. Use --json to retrieve the full token.');
    lines.push('Store this token securely. It is only returned once.');
  }

  writeText(stdout, lines);
}

function printCoworkerApiKey(stdout, coworkerId, apiKey) {
  const masked = apiKey.token
    ? `${apiKey.token.slice(0, 8)}..${apiKey.token.slice(-4)}`
    : '(none)';
  writeText(stdout, [
    `Created API key for coworker ${coworkerId}`,
    apiKey.name ? `name: ${apiKey.name}` : '',
    apiKey.expiresAt ? `expiresAt: ${apiKey.expiresAt.toISOString()}` : '',
    `token: ${masked}`,
    'WARNING: Token is partially masked in text output. Use --json to retrieve the full token.',
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
    capabilities: validateCapabilities(normalizeCapabilities(getOption(args, 'capability', 'capabilities'))),
    metadata: mergedMetadata
  };
}

async function handleDiscoverCommand(args, io, {signal} = {}) {
  const jsonOutput = isJsonOutput(args);

  const results = await Promise.allSettled([
    fetchAgents({signal}),
    fetchCoworkers({signal}),
    fetchJobs({signal})
  ]);

  const agents = results[0].status === 'fulfilled' ? results[0].value.agents : [];
  const coworkers = results[1].status === 'fulfilled' ? results[1].value.coworkers : [];
  const jobs = results[2].status === 'fulfilled' ? results[2].value.jobs : [];

  const errors = [];
  if (results[0].status === 'rejected') errors.push({resource: 'agents', message: results[0].reason?.message || 'fetch failed'});
  if (results[1].status === 'rejected') errors.push({resource: 'coworkers', message: results[1].reason?.message || 'fetch failed'});
  if (results[2].status === 'rejected') errors.push({resource: 'jobs', message: results[2].reason?.message || 'fetch failed'});

  const resolvedApiUrl = process.env.SOKOSUMI_API_URL || DEFAULT_API_URL;
  const environment = resolvedApiUrl.includes('preprod') ? 'preprod' : 'mainnet';

  const discover = {
    version: CLI_VERSION,
    apiUrl: resolvedApiUrl,
    environment,
    capabilities: VALID_CAPABILITIES,
    commands: [
      'agents list', 'agents hire',
      'vendors list', 'vendors me',
      'coworkers list', 'coworkers connect', 'coworkers register', 'coworkers update', 'coworkers api-key', 'coworkers me',
      'tasks list', 'tasks create', 'tasks get', 'tasks events', 'tasks jobs', 'tasks comment',
      'jobs list', 'jobs get'
    ],
    agents: agents.map(a => ({
      id: a.id,
      name: a.name,
      status: a.status,
      tags: (a.tags || []).map(t => t.name).filter(Boolean),
      price: a.price?.credits != null ? {credits: a.price.credits} : null
    })),
    coworkers: coworkers.map(c => ({
      id: c.id,
      name: c.name,
      company: c.company,
      capabilities: c.capabilities,
      baseURL: c.baseURL
    })),
    jobs: jobs.map(j => ({
      id: j.id,
      name: j.name,
      status: j.status,
      agentId: j.agentId
    })),
    errors: errors.length > 0 ? errors : undefined
  };

  if (jsonOutput) {
    writeJson(io.stdout, discover);
  } else {
    const lines = [
      `Sokosumi CLI v${CLI_VERSION}`,
      `API: ${discover.apiUrl} [${discover.environment}]`,
      '',
      `Agents (${agents.length}):`,
      ...agents.map(a => `  ${a.name || 'Unnamed'} [${a.id}] — ${a.status || 'unknown'}`),
      '',
      `Coworkers (${coworkers.length}):`,
      ...coworkers.map(c => `  ${c.name || 'Unnamed'} [${c.id}] — ${(c.capabilities || []).join(', ') || 'none'}`),
      '',
      `Jobs (${jobs.length}):`,
      ...jobs.map(j => `  ${j.name || j.id} [${j.id}] — ${j.status || 'unknown'}`),
      '',
      'Commands: agents list, agents hire, vendors list, vendors me, coworkers list, coworkers connect, coworkers register, coworkers update, coworkers api-key, coworkers me, tasks list, tasks create, tasks get, tasks events, tasks jobs, tasks comment, jobs list, jobs get'
    ];

    if (errors.length > 0) {
      lines.push('', 'Errors:');
      for (const err of errors) {
        lines.push(`  ${err.resource}: ${err.message}`);
      }
    }

    writeText(io.stdout, lines);
  }

  return 0;
}

async function handleAgentsCommand(args, io, {signal} = {}) {
  const subcommand = args._[1];
  const jsonOutput = isJsonOutput(args);

  if (!subcommand || subcommand === 'list') {
    const limit = parsePositiveInteger(getOption(args, 'limit'), {label: '--limit'});
    const {agents} = await fetchAgents({signal});
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

    if (!getOption(args, 'input-json') && !getOption(args, 'input-file')) {
      throw new Error('--input-json or --input-file is required for `agents hire`');
    }

    const inputData = await readJsonObject({
      jsonText: getOption(args, 'input-json'),
      filePath: getOption(args, 'input-file'),
      label: 'input'
    });

    const maxCredits = parsePositiveInteger(getOption(args, 'max-credits'), {label: '--max-credits'});
    const {schema} = await fetchAgentInputSchema(agentId, {signal});
    const {job} = await createAgentJob(agentId, {
      inputSchema: schema,
      inputData,
      maxCredits,
      name: getOption(args, 'name')
    }, {signal});

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

function printVendorList(stdout, vendors) {
  if (vendors.length === 0) {
    writeText(stdout, ['No vendors available.']);
    return;
  }

  const lines = ['Vendors'];
  for (const vendor of vendors) {
    lines.push(`${vendor.name || 'Unnamed'} [${vendor.id}]`);
    if (vendor.slug) lines.push(`  slug: ${vendor.slug}`);
  }
  writeText(stdout, lines);
}

async function handleVendorsCommand(args, io, {signal} = {}) {
  const subcommand = args._[1];
  const jsonOutput = isJsonOutput(args);

  if (!subcommand || subcommand === 'list') {
    const {vendors} = await fetchVendors({signal});
    const filtered = applyListFilters(vendors, {
      search: getOption(args, 'search'),
      limit: parsePositiveInteger(getOption(args, 'limit'), {label: '--limit'}),
      fields: (vendor) => [vendor.id, vendor.slug, vendor.name]
    });

    if (jsonOutput) {
      writeJson(io.stdout, {vendors: filtered});
    } else {
      printVendorList(io.stdout, filtered);
    }
    return 0;
  }

  if (subcommand === 'me') {
    const {vendors} = await fetchMyVendors({signal});
    if (jsonOutput) {
      writeJson(io.stdout, {vendors});
    } else if (vendors.length === 0) {
      writeText(io.stdout, ['You are not a member of any vendor.']);
    } else {
      const lines = ['Your vendor memberships'];
      for (const vendor of vendors) {
        lines.push(`${vendor.name || 'Unnamed'} [${vendor.id}] — role: ${vendor.role || 'unknown'}`);
      }
      writeText(io.stdout, lines);
    }
    return 0;
  }

  throw new Error(`Unknown vendors subcommand: ${subcommand}`);
}

async function handleCoworkersCommand(args, io, {signal} = {}) {
  const subcommand = args._[1];
  const jsonOutput = isJsonOutput(args);

  if (!subcommand || subcommand === 'list') {
    const limit = parsePositiveInteger(getOption(args, 'limit'), {label: '--limit'});
    const rawCaps = getOption(args, 'capability', 'capabilities');
    const capabilities = rawCaps != null
      ? validateCapabilities(normalizeCapabilities(rawCaps))
      : [];
    const {coworkers} = await fetchCoworkers({
      scope: getOption(args, 'scope'),
      capabilities,
      signal
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

  if (subcommand === 'connect') {
    const coworkerId = args._[2] || getOption(args, 'id', 'coworker-id');
    if (!coworkerId) {
      throw new Error('coworker id is required for `coworkers connect`');
    }

    const organizationId = getOption(args, 'organization-id', 'organizationId');
    if (!organizationId) {
      throw new Error('organization id is required for `coworkers connect`');
    }

    const baseURL = getOption(args, 'base-url', 'baseURL');
    if (!baseURL) {
      throw new Error('base URL is required for `coworkers connect`');
    }

    const providerApiKey = await resolveProviderApiKey(args, io);
    const idempotencyKey = getOption(args, 'idempotency-key') ?? `cli_connect_${randomUUID()}`;
    const {connection} = await connectCoworker(coworkerId, {
      organizationId,
      baseURL,
      providerApiKey,
      idempotencyKey,
      signal
    });
    const runtimeKey = connection?.runtimeKey;
    if (!runtimeKey?.token) {
      throw new Error('Connection response did not include a one-time runtime key');
    }

    if (jsonOutput) {
      writeJson(io.stdout, {connection});
    } else {
      writeText(io.stdout, [
        `Connected coworker ${connection.coworkerId || coworkerId}`,
        connection.workspaceId ? `workspace: ${connection.workspaceId}` : '',
        `runtime key (shown once): ${runtimeKey.token}`,
        runtimeKey.expiresAt ? `expires: ${runtimeKey.expiresAt}` : 'expires: not set'
      ]);
    }
    return 0;
  }

  if (subcommand === 'register') {
    const payload = await buildCoworkerCreatePayload(args);
    const vendorId = getOption(args, 'vendor-id', 'vendorId');
    if (!vendorId) {
      throw new Error('vendor id is required for `coworkers register`. Pass the vendorId you are authorized to create under with --vendor-id. `sokosumi vendors list` shows platform vendor ids; creating a coworker needs a platform-admin key.');
    }
    payload.vendorId = vendorId;
    const shouldCreateApiKey = Boolean(getOption(args, 'create-api-key', 'with-api-key'));
    const {coworker} = await createCoworker(payload, {signal});

    let apiKey = null;
    if (shouldCreateApiKey) {
      const apiKeyResult = await createCoworkerApiKey(coworker.id, {
        name: getOption(args, 'api-key-name'),
        expiresAt: getOption(args, 'api-key-expires-at')
      }, {signal});
      apiKey = apiKeyResult.apiKey;
    }

    if (jsonOutput) {
      writeJson(io.stdout, {coworker, apiKey});
    } else {
      printCoworkerRegistration(io.stdout, coworker, apiKey);
    }
    return 0;
  }

  if (subcommand === 'update') {
    const coworkerId = args._[2] || getOption(args, 'id', 'coworker-id');
    if (!coworkerId) {
      throw new Error('coworker id is required for `coworkers update`');
    }

    const payload = await buildCoworkerCreatePayload(args);
    // For updates, name is optional — only include if explicitly provided
    if (getOption(args, 'name') == null) {
      delete payload.name;
    }

    const {coworker} = await updateCoworker(coworkerId, payload, {signal});

    if (jsonOutput) {
      writeJson(io.stdout, {coworker});
    } else {
      writeText(io.stdout, [
        `Updated coworker ${coworker.name || coworker.id} [${coworker.id}]`,
        coworker.baseURL ? `baseURL: ${coworker.baseURL}` : '',
        Array.isArray(coworker.capabilities) && coworker.capabilities.length > 0
          ? `capabilities: ${coworker.capabilities.join(', ')}`
          : ''
      ]);
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
    }, {signal});

    if (jsonOutput) {
      writeJson(io.stdout, {coworkerId, apiKey});
    } else {
      printCoworkerApiKey(io.stdout, coworkerId, apiKey);
    }
    return 0;
  }

  if (subcommand === 'me') {
    const {coworker} = await fetchCurrentCoworker({signal});
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

async function collectTaskDetails(taskId, {signal} = {}) {
  const [eventsResult, jobsResult] = await Promise.allSettled([
    fetchTaskEvents(taskId, {signal}),
    fetchTaskJobs(taskId, {signal})
  ]);
  const detailsErrors = [];
  const details = {};

  if (eventsResult.status === 'fulfilled') {
    details.events = eventsResult.value.events;
  } else {
    detailsErrors.push({resource: 'events', message: eventsResult.reason?.message || 'fetch failed'});
  }

  if (jobsResult.status === 'fulfilled') {
    details.jobs = jobsResult.value.jobs;
  } else {
    detailsErrors.push({resource: 'jobs', message: jobsResult.reason?.message || 'fetch failed'});
  }

  if (detailsErrors.length > 0) {
    details.detailsErrors = detailsErrors;
  }

  return details;
}

async function collectJobDetails(jobId, {signal} = {}) {
  const [eventsResult, filesResult, linksResult, inputRequestResult] = await Promise.allSettled([
    fetchJobEvents(jobId, {signal}),
    fetchJobFiles(jobId, {signal}),
    fetchJobLinks(jobId, {signal}),
    fetchJobInputRequest(jobId, {signal})
  ]);
  const detailsErrors = [];
  const details = {};

  if (eventsResult.status === 'fulfilled') {
    details.events = eventsResult.value.events;
  } else {
    detailsErrors.push({resource: 'events', message: eventsResult.reason?.message || 'fetch failed'});
  }

  if (filesResult.status === 'fulfilled') {
    details.files = filesResult.value.files;
  } else {
    detailsErrors.push({resource: 'files', message: filesResult.reason?.message || 'fetch failed'});
  }

  if (linksResult.status === 'fulfilled') {
    details.links = linksResult.value.links;
  } else {
    detailsErrors.push({resource: 'links', message: linksResult.reason?.message || 'fetch failed'});
  }

  if (inputRequestResult.status === 'fulfilled') {
    details.inputRequest = inputRequestResult.value.inputRequest;
  } else {
    detailsErrors.push({resource: 'inputRequest', message: inputRequestResult.reason?.message || 'fetch failed'});
  }

  if (detailsErrors.length > 0) {
    details.detailsErrors = detailsErrors;
  }

  return details;
}

async function handleTasksCommand(args, io, {signal} = {}) {
  const subcommand = args._[1];
  const jsonOutput = isJsonOutput(args);

  if (!subcommand || subcommand === 'list') {
    const limit = parsePositiveInteger(getOption(args, 'limit'), {label: '--limit'});
    const {tasks} = await fetchTasks({
      q: getOption(args, 'search', 'q'),
      status: getOption(args, 'status'),
      scope: getOption(args, 'scope'),
      coworkerId: getOption(args, 'coworker-id'),
      take: limit,
      signal
    });
    const filtered = Number.isInteger(limit) ? tasks.slice(0, limit) : tasks;

    if (jsonOutput) {
      writeJson(io.stdout, {tasks: filtered});
    } else {
      printTaskList(io.stdout, filtered);
    }
    return 0;
  }

  if (subcommand === 'create') {
    const coworkerId = getOption(args, 'coworker-id');
    const description = getOption(args, 'description', 'desc');

    if (!coworkerId) {
      throw new Error('--coworker-id is required for `tasks create`');
    }

    if (!description) {
      throw new Error('--description is required for `tasks create`');
    }

    const {task} = await createTask({
      coworkerId,
      description,
      name: getOption(args, 'name'),
      status: parseTaskCreateStatus(getOption(args, 'status'))
    }, {signal});
    const details = await collectTaskDetails(task.id, {signal});

    if (jsonOutput) {
      writeJson(io.stdout, {task, ...details});
    } else {
      printTask(io.stdout, task, details);
    }
    return 0;
  }

  if (subcommand === 'get') {
    const taskId = args._[2] || getOption(args, 'id', 'task-id');
    if (!taskId) {
      throw new Error('task id is required for `tasks get`');
    }

    const {task} = await fetchTask(taskId, {signal});
    const details = await collectTaskDetails(taskId, {signal});

    if (jsonOutput) {
      writeJson(io.stdout, {task, ...details});
    } else {
      printTask(io.stdout, task, details);
    }
    return 0;
  }

  if (subcommand === 'events') {
    const taskId = args._[2] || getOption(args, 'id', 'task-id');
    if (!taskId) {
      throw new Error('task id is required for `tasks events`');
    }

    const {events} = await fetchTaskEvents(taskId, {signal});

    if (jsonOutput) {
      writeJson(io.stdout, {events});
    } else {
      printEvents(io.stdout, events);
    }
    return 0;
  }

  if (subcommand === 'jobs') {
    const taskId = args._[2] || getOption(args, 'id', 'task-id');
    if (!taskId) {
      throw new Error('task id is required for `tasks jobs`');
    }

    const {jobs} = await fetchTaskJobs(taskId, {signal});

    if (jsonOutput) {
      writeJson(io.stdout, {jobs});
    } else {
      printJobList(io.stdout, jobs);
    }
    return 0;
  }

  if (subcommand === 'comment') {
    const taskId = args._[2] || getOption(args, 'id', 'task-id');
    const comment = getOption(args, 'comment');
    const status = getOption(args, 'status');

    if (!taskId) {
      throw new Error('task id is required for `tasks comment`');
    }

    if (!comment && !status) {
      throw new Error('--comment or --status is required for `tasks comment`');
    }

    const {event} = await createTaskEvent(taskId, {comment, status}, {signal});

    if (jsonOutput) {
      writeJson(io.stdout, {event});
    } else {
      writeText(io.stdout, [
        `Created task event ${event?.id || ''}`.trim(),
        status ? `status: ${status}` : '',
        comment ? `comment: ${truncate(comment, 220)}` : ''
      ]);
    }
    return 0;
  }

  throw new Error(`Unknown tasks subcommand: ${subcommand}`);
}

async function handleJobsCommand(args, io, {signal} = {}) {
  const subcommand = args._[1];
  const jsonOutput = isJsonOutput(args);

  if (!subcommand || subcommand === 'list') {
    const limit = parsePositiveInteger(getOption(args, 'limit'), {label: '--limit'});
    const {jobs} = await fetchJobs({signal});
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

    const {job} = await fetchJob(jobId, {signal});
    const details = args.details === true || args.details === 'true'
      ? await collectJobDetails(jobId, {signal})
      : {};

    if (jsonOutput) {
      writeJson(io.stdout, {job, ...details});
    } else {
      printJob(io.stdout, job, details);
    }
    return 0;
  }

  throw new Error(`Unknown jobs subcommand: ${subcommand}`);
}

const DEFAULT_TIMEOUT_MS = 30_000;

export async function runCli(argv, io = {}) {
  const stdout = io.stdout || process.stdout;
  const stderr = io.stderr || process.stderr;
  const stdin = io.stdin || process.stdin;
  const args = parseArgs(argv);

  if (args.version) {
    writeText(stdout, [`sokosumi ${CLI_VERSION}`]);
    return 0;
  }

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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    if (command === 'discover') {
      return await handleDiscoverCommand(args, {stdout, stderr}, {signal: controller.signal});
    }

    if (command === 'agents') {
      return await handleAgentsCommand(args, {stdout, stderr}, {signal: controller.signal});
    }

    if (command === 'vendors') {
      return await handleVendorsCommand(args, {stdout, stderr}, {signal: controller.signal});
    }

    if (command === 'coworkers') {
      return await handleCoworkersCommand(args, {stdout, stderr, stdin}, {signal: controller.signal});
    }

    if (command === 'tasks') {
      return await handleTasksCommand(args, {stdout, stderr}, {signal: controller.signal});
    }

    if (command === 'jobs') {
      return await handleJobsCommand(args, {stdout, stderr}, {signal: controller.signal});
    }

    if (command === 'help') {
      writeText(stdout, [HELP_TEXT.trimEnd()]);
      return 0;
    }

    throw new Error(`Unknown command: ${command}`);
  } catch (error) {
    const message = error?.name === 'AbortError'
      ? `Request timed out after ${DEFAULT_TIMEOUT_MS / 1000}s`
      : (error?.message || 'Unknown error');

    if (isJsonOutput(args)) {
      writeJson(stdout, buildErrorPayload({...error, message}));
    } else {
      writeText(stderr, [
        `Error: ${message}`,
        error?.status ? `status: ${error.status}` : '',
        error?.body ? `body: ${typeof error.body === 'string' ? error.body : JSON.stringify(error.body)}` : ''
      ]);
    }
    return 1;
  } finally {
    clearTimeout(timeout);
  }
}
