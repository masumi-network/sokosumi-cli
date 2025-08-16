import {httpGet, httpPost} from '../http-client.mjs';
import {ApiResponse} from '../models/api-response.mjs';
import {Agent} from '../models/agent.mjs';
import {AgentJob} from '../models/agent-job.mjs';

const AGENTS_PATH = '/api/v1/agents';

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
  const data = resp?.data || {};
  const fields = Array.isArray(data.input_data) ? data.input_data : [];
  return {response: resp, fields};
}

export async function createAgentJob(agentId, {inputData, maxAcceptedCredits}, {signal} = {}) {
  if (!agentId) throw new Error('agentId is required');
  const payload = {inputData: inputData || {}, maxAcceptedCredits};
  const json = await httpPost(`${AGENTS_PATH}/${agentId}/jobs`, payload, {signal});
  const resp = ApiResponse.from(json);
  const job = AgentJob.from(resp.data);
  return {response: resp, job};
}


