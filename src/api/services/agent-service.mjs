import {httpGet, httpPost} from '../http-client.mjs';
import {ApiResponse} from '../models/api-response.mjs';
import {Agent} from '../models/agent.mjs';
import {AgentJob} from '../models/agent-job.mjs';

const AGENTS_PATH = '/v1/agents';

function extractInputSchemaFields(schema) {
  if (Array.isArray(schema?.input_data)) {
    return schema.input_data;
  }

  if (Array.isArray(schema?.input_groups)) {
    return schema.input_groups.flatMap(group => (
      Array.isArray(group?.input_data) ? group.input_data : []
    ));
  }

  return [];
}

export async function fetchAgents({signal} = {}) {
  const json = await httpGet(AGENTS_PATH, {signal});
  const resp = ApiResponse.from(json);
  const list = Array.isArray(resp.data) ? resp.data : [];
  const agents = list.map(Agent.from);
  return {response: resp, agents};
}

export async function fetchAgentJobs(agentId, {signal} = {}) {
  if (!agentId) throw new Error('agentId is required');
  const json = await httpGet(`${AGENTS_PATH}/${agentId}/jobs`, {signal});
  const resp = ApiResponse.from(json);
  const list = Array.isArray(resp.data) ? resp.data : [];
  const jobs = list.map(AgentJob.from);
  return {response: resp, jobs};
}

export async function fetchAgentInputSchema(agentId, {signal} = {}) {
  if (!agentId) throw new Error('agentId is required');
  const json = await httpGet(`${AGENTS_PATH}/${agentId}/input-schema`, {signal});
  const resp = ApiResponse.from(json);
  const schema = resp?.data || {};
  const fields = extractInputSchemaFields(schema);
  return {response: resp, schema, fields};
}

export async function createAgentJob(agentId, {inputSchema, inputData, maxCredits, name} = {}, {signal} = {}) {
  if (!agentId) throw new Error('agentId is required');
  if (!inputSchema) throw new Error('inputSchema is required');

  const payload = {
    inputSchema,
    inputData: inputData || {},
    maxCredits: Number.isFinite(maxCredits) && maxCredits > 0 ? maxCredits : undefined,
    name: name ? String(name).trim() : undefined
  };

  const json = await httpPost(`${AGENTS_PATH}/${agentId}/jobs`, payload, {signal});
  const resp = ApiResponse.from(json);
  const job = AgentJob.from(resp.data);
  return {response: resp, job};
}

