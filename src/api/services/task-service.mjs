import {httpGet, httpPost} from '../http-client.mjs';
import {ApiResponse} from '../models/api-response.mjs';
import {Task} from '../models/task.mjs';
import {AgentJob} from '../models/agent-job.mjs';

const TASKS_PATH = '/v1/tasks';

/**
 * Creates a new task for coworker orchestration
 * @param {Object} data
 * @param {string} [data.name] - Task name
 * @param {string} [data.description] - Task description
 * @param {string} [data.coworkerId] - Coworker ID (optional)
 * @param {string} [data.status] - Initial task status (`DRAFT` or `READY`)
 * @param {Object} options
 * @param {AbortSignal} [options.signal] - Abort signal
 * @returns {Promise<{response: ApiResponse, task: Task}>}
 */
export async function createTask({name, description, coworkerId, status} = {}, {signal} = {}) {
  const payload = {
    name: name || 'New Task',
    description: description || '',
    coworkerId,
    status: status || undefined
  };

  const json = await httpPost(TASKS_PATH, payload, {signal});
  const resp = ApiResponse.from(json);
  const task = Task.from(resp.data);
  return {response: resp, task};
}

/**
 * Fetches a specific task by ID
 * @param {string} taskId - Task ID
 * @param {Object} options
 * @param {AbortSignal} [options.signal] - Abort signal
 * @returns {Promise<{response: ApiResponse, task: Task}>}
 */
export async function fetchTask(taskId, {signal} = {}) {
  if (!taskId) throw new Error('taskId is required');
  const json = await httpGet(`${TASKS_PATH}/${taskId}`, {signal});
  const resp = ApiResponse.from(json);
  const task = Task.from(resp.data);
  return {response: resp, task};
}

/**
 * Fetches all tasks for the current user
 * @param {Object} options
 * @param {AbortSignal} [options.signal] - Abort signal
 * @returns {Promise<{response: ApiResponse, tasks: Task[]}>}
 */
export async function fetchTasks({signal} = {}) {
  const json = await httpGet(TASKS_PATH, {signal});
  const resp = ApiResponse.from(json);
  const list = Array.isArray(resp.data) ? resp.data : [];
  const tasks = list.map(Task.from);
  return {response: resp, tasks};
}

/**
 * Fetches jobs for a specific task
 * @param {string} taskId - Task ID
 * @param {Object} options
 * @param {AbortSignal} [options.signal] - Abort signal
 * @returns {Promise<{response: ApiResponse, jobs: AgentJob[]}>}
 */
export async function fetchTaskJobs(taskId, {signal} = {}) {
  if (!taskId) throw new Error('taskId is required');
  const json = await httpGet(`${TASKS_PATH}/${taskId}/jobs`, {signal});
  const resp = ApiResponse.from(json);
  const list = Array.isArray(resp.data) ? resp.data : [];
  const jobs = list.map(AgentJob.from);
  return {response: resp, jobs};
}

/**
 * Adds a job to an existing task
 * @param {string} taskId - Task ID
 * @param {Object} jobData
 * @param {string} jobData.agentId - Agent ID
 * @param {Object} jobData.inputSchema - Input schema for the agent
 * @param {Object} jobData.inputData - Input data for the agent
 * @param {number} [jobData.maxCredits] - Max accepted credits for the job
 * @param {string} [jobData.name] - Job name
 * @param {Object} options
 * @param {AbortSignal} [options.signal] - Abort signal
 * @returns {Promise<{response: ApiResponse, job: Object}>}
 */
export async function addJobToTask(taskId, {agentId, inputSchema, inputData, maxCredits, name} = {}, {signal} = {}) {
  if (!taskId) throw new Error('taskId is required');
  if (!agentId) throw new Error('agentId is required');
  if (!inputSchema) throw new Error('inputSchema is required');

  const payload = {
    agentId,
    inputSchema,
    inputData: inputData || {},
    maxCredits: Number.isFinite(maxCredits) && maxCredits > 0 ? maxCredits : undefined,
    name: name ? String(name).trim() : undefined
  };

  const json = await httpPost(`${TASKS_PATH}/${taskId}/jobs`, payload, {signal});
  const resp = ApiResponse.from(json);
  return {response: resp, job: resp.data};
}

/**
 * Fetches events for a specific task
 * @param {string} taskId - Task ID
 * @param {Object} options
 * @param {AbortSignal} [options.signal] - Abort signal
 * @returns {Promise<{response: ApiResponse, events: Array}>}
 */
export async function fetchTaskEvents(taskId, {signal} = {}) {
  if (!taskId) throw new Error('taskId is required');
  const json = await httpGet(`${TASKS_PATH}/${taskId}/events`, {signal});
  const resp = ApiResponse.from(json);
  const list = Array.isArray(resp.data) ? resp.data : [];
  return {response: resp, events: list};
}

/**
 * Creates a task event (status update or comment)
 * @param {string} taskId - Task ID
 * @param {Object} data
 * @param {string} [data.status] - New task status
 * @param {string} [data.comment] - Comment text
 * @param {Object} options
 * @param {AbortSignal} [options.signal] - Abort signal
 * @returns {Promise<{response: ApiResponse, event: Object}>}
 */
export async function createTaskEvent(taskId, {status, comment} = {}, {signal} = {}) {
  if (!taskId) throw new Error('taskId is required');

  const payload = {};
  if (status) payload.status = status;
  if (comment) payload.comment = comment;

  const json = await httpPost(`${TASKS_PATH}/${taskId}/events`, payload, {signal});
  const resp = ApiResponse.from(json);
  return {response: resp, event: resp.data};
}
