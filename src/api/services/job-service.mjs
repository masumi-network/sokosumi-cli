import {httpGet, httpPost} from '../http-client.mjs';
import {ApiResponse} from '../models/api-response.mjs';
import {AgentJob} from '../models/agent-job.mjs';
import {JobEvent} from '../models/job-event.mjs';
import {JobFile, JobLink} from '../models/job-output.mjs';

const JOBS_PATH = '/v1/jobs';

/**
 * Fetches all jobs for the current user
 * @param {Object} options
 * @param {AbortSignal} [options.signal] - Abort signal
 * @returns {Promise<{response: ApiResponse, jobs: AgentJob[]}>}
 */
export async function fetchJobs({signal} = {}) {
  const json = await httpGet(JOBS_PATH, {signal});
  const resp = ApiResponse.from(json);
  const list = Array.isArray(resp.data) ? resp.data : [];
  const jobs = list.map(AgentJob.from);
  return {response: resp, jobs};
}

/**
 * Fetches a specific job by ID
 * @param {string} jobId - Job ID
 * @param {Object} options
 * @param {AbortSignal} [options.signal] - Abort signal
 * @returns {Promise<{response: ApiResponse, job: AgentJob}>}
 */
export async function fetchJob(jobId, {signal} = {}) {
  if (!jobId) throw new Error('jobId is required');
  const json = await httpGet(`${JOBS_PATH}/${jobId}`, {signal});
  const resp = ApiResponse.from(json);
  const job = AgentJob.from(resp.data);
  return {response: resp, job};
}

/**
 * Fetches events for a specific job
 * @param {string} jobId - Job ID
 * @param {Object} options
 * @param {AbortSignal} [options.signal] - Abort signal
 * @returns {Promise<{response: ApiResponse, events: JobEvent[]}>}
 */
export async function fetchJobEvents(jobId, {signal} = {}) {
  if (!jobId) throw new Error('jobId is required');
  const json = await httpGet(`${JOBS_PATH}/${jobId}/events`, {signal});
  const resp = ApiResponse.from(json);
  const list = Array.isArray(resp.data) ? resp.data : [];
  const events = list.map(JobEvent.from);
  return {response: resp, events};
}

/**
 * Fetches file outputs for a specific job
 * @param {string} jobId - Job ID
 * @param {Object} options
 * @param {AbortSignal} [options.signal] - Abort signal
 * @returns {Promise<{response: ApiResponse, files: JobFile[]}>}
 */
export async function fetchJobFiles(jobId, {signal} = {}) {
  if (!jobId) throw new Error('jobId is required');
  const json = await httpGet(`${JOBS_PATH}/${jobId}/files`, {signal});
  const resp = ApiResponse.from(json);
  const list = Array.isArray(resp.data) ? resp.data : [];
  const files = list.map(JobFile.from);
  return {response: resp, files};
}

/**
 * Fetches link outputs for a specific job
 * @param {string} jobId - Job ID
 * @param {Object} options
 * @param {AbortSignal} [options.signal] - Abort signal
 * @returns {Promise<{response: ApiResponse, links: JobLink[]}>}
 */
export async function fetchJobLinks(jobId, {signal} = {}) {
  if (!jobId) throw new Error('jobId is required');
  const json = await httpGet(`${JOBS_PATH}/${jobId}/links`, {signal});
  const resp = ApiResponse.from(json);
  const list = Array.isArray(resp.data) ? resp.data : [];
  const links = list.map(JobLink.from);
  return {response: resp, links};
}

/**
 * Checks if a job is requesting additional input
 * @param {string} jobId - Job ID
 * @param {Object} options
 * @param {AbortSignal} [options.signal] - Abort signal
 * @returns {Promise<{response: ApiResponse, inputRequest: Object|null}>}
 */
export async function fetchJobInputRequest(jobId, {signal} = {}) {
  if (!jobId) throw new Error('jobId is required');
  const json = await httpGet(`${JOBS_PATH}/${jobId}/input-request`, {signal});
  const resp = ApiResponse.from(json);
  return {response: resp, inputRequest: resp.data};
}

/**
 * Provides additional input to a job
 * @param {string} jobId - Job ID
 * @param {Object} data
 * @param {Array} data.inputData - Input data to provide
 * @param {Object} options
 * @param {AbortSignal} [options.signal] - Abort signal
 * @returns {Promise<{response: ApiResponse}>}
 */
export async function submitJobInput(jobId, {inputData} = {}, {signal} = {}) {
  if (!jobId) throw new Error('jobId is required');
  const payload = {inputData: inputData || []};
  const json = await httpPost(`${JOBS_PATH}/${jobId}/inputs`, payload, {signal});
  const resp = ApiResponse.from(json);
  return {response: resp};
}
