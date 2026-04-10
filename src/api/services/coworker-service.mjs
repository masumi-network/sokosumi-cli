import {httpGet, httpPatch, httpPost} from '../http-client.mjs';
import {ApiResponse} from '../models/api-response.mjs';
import {Coworker, CoworkerApiKey} from '../models/coworker.mjs';
import {normalizeCapabilities} from '../../utils/normalize.mjs';

const COWORKERS_PATH = '/v1/coworkers';

function buildCoworkersPath({scope, capability, capabilities} = {}) {
  const params = new URLSearchParams();
  const resolvedCapabilities = normalizeCapabilities(capabilities ?? capability);

  if (scope) {
    params.set('scope', String(scope).trim());
  }

  for (const entry of resolvedCapabilities) {
    params.append('capability', entry);
  }

  const query = params.toString();
  return query ? `${COWORKERS_PATH}?${query}` : COWORKERS_PATH;
}

/**
 * Fetches all available coworkers
 * @param {Object} options
 * @param {string} [options.scope] - Coworker visibility scope
 * @param {string|string[]} [options.capability] - Coworker capability filter(s)
 * @param {AbortSignal} [options.signal] - Abort signal
 * @returns {Promise<{response: ApiResponse, coworkers: Coworker[]}>}
 */
export async function fetchCoworkers({scope, capability, capabilities, signal} = {}) {
  const json = await httpGet(buildCoworkersPath({scope, capability, capabilities}), {signal});
  const resp = ApiResponse.from(json);
  const list = Array.isArray(resp.data) ? resp.data : [];
  const coworkers = list.map(Coworker.from);
  return {response: resp, coworkers};
}

/**
 * Fetches a specific coworker by ID
 * @param {string} coworkerId - Coworker ID
 * @param {Object} options
 * @param {AbortSignal} [options.signal] - Abort signal
 * @returns {Promise<{response: ApiResponse, coworker: Coworker}>}
 */
export async function fetchCoworker(coworkerId, {signal} = {}) {
  if (!coworkerId) throw new Error('coworkerId is required');
  const json = await httpGet(`${COWORKERS_PATH}/${coworkerId}`, {signal});
  const resp = ApiResponse.from(json);
  const coworker = Coworker.from(resp.data);
  return {response: resp, coworker};
}

/**
 * Fetches the currently authenticated coworker
 * @param {Object} options
 * @param {AbortSignal} [options.signal] - Abort signal
 * @returns {Promise<{response: ApiResponse, coworker: Coworker}>}
 */
export async function fetchCurrentCoworker({signal} = {}) {
  const json = await httpGet(`${COWORKERS_PATH}/me`, {signal});
  const resp = ApiResponse.from(json);
  const coworker = Coworker.from(resp.data);
  return {response: resp, coworker};
}

/**
 * Creates a coworker
 * @param {Object} data
 * @param {string} data.name
 * @param {string|null} [data.caption]
 * @param {string|null} [data.company]
 * @param {string|null} [data.companyLogo]
 * @param {string|null} [data.url]
 * @param {string|null} [data.baseURL]
 * @param {string|null} [data.description]
 * @param {string|null} [data.image]
 * @param {string[]} [data.capabilities]
 * @param {Object} options
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<{response: ApiResponse, coworker: Coworker}>}
 */
export async function createCoworker(data = {}, {signal} = {}) {
  const payload = {
    name: data?.name ? String(data.name).trim() : '',
    caption: data?.caption != null ? String(data.caption).trim() || null : undefined,
    company: data?.company != null ? String(data.company).trim() || null : undefined,
    companyLogo: data?.companyLogo != null ? String(data.companyLogo).trim() || null : undefined,
    url: data?.url != null ? String(data.url).trim() || null : undefined,
    baseURL: data?.baseURL != null ? String(data.baseURL).trim() || null : undefined,
    description: data?.description != null ? String(data.description).trim() || null : undefined,
    image: data?.image != null ? String(data.image).trim() || null : undefined,
    capabilities: normalizeCapabilities(data?.capabilities),
    priority: Number.isInteger(data?.priority) ? data.priority : undefined,
    metadata: data?.metadata && typeof data.metadata === 'object' && !Array.isArray(data.metadata)
      ? data.metadata
      : undefined
  };

  if (!payload.name) {
    throw new Error('name is required');
  }

  const json = await httpPost(COWORKERS_PATH, payload, {signal});
  const resp = ApiResponse.from(json);
  const coworker = Coworker.from(resp.data);
  return {response: resp, coworker};
}

/**
 * Updates coworker metadata
 * @param {string} coworkerId
 * @param {Object} data
 * @param {Object} options
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<{response: ApiResponse, coworker: Coworker}>}
 */
export async function updateCoworker(coworkerId, data = {}, {signal} = {}) {
  if (!coworkerId) throw new Error('coworkerId is required');

  const payload = {
    name: data?.name != null ? String(data.name).trim() : undefined,
    caption: data?.caption != null ? String(data.caption).trim() || null : undefined,
    company: data?.company != null ? String(data.company).trim() || null : undefined,
    companyLogo: data?.companyLogo != null ? String(data.companyLogo).trim() || null : undefined,
    url: data?.url != null ? String(data.url).trim() || null : undefined,
    baseURL: data?.baseURL != null ? String(data.baseURL).trim() || null : undefined,
    description: data?.description != null ? String(data.description).trim() || null : undefined,
    image: data?.image != null ? String(data.image).trim() || null : undefined,
    capabilities: data?.capabilities != null ? normalizeCapabilities(data.capabilities) : undefined,
    priority: Number.isInteger(data?.priority) ? data.priority : undefined,
    metadata: data?.metadata && typeof data.metadata === 'object' && !Array.isArray(data.metadata)
      ? data.metadata
      : undefined
  };

  const json = await httpPatch(`${COWORKERS_PATH}/${coworkerId}`, payload, {signal});
  const resp = ApiResponse.from(json);
  const coworker = Coworker.from(resp.data);
  return {response: resp, coworker};
}

/**
 * Creates an API key for a coworker
 * @param {string} coworkerId
 * @param {Object} data
 * @param {string|null} [data.name]
 * @param {string|null} [data.expiresAt]
 * @param {Object} options
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<{response: ApiResponse, apiKey: CoworkerApiKey}>}
 */
export async function createCoworkerApiKey(coworkerId, {name, expiresAt} = {}, {signal} = {}) {
  if (!coworkerId) throw new Error('coworkerId is required');

  const payload = {
    name: name != null ? String(name).trim() || null : undefined,
    expiresAt: expiresAt != null ? String(expiresAt).trim() || null : undefined
  };

  const json = await httpPost(`${COWORKERS_PATH}/${coworkerId}/api-keys`, payload, {signal});
  const resp = ApiResponse.from(json);
  const apiKey = CoworkerApiKey.from(resp.data);
  return {response: resp, apiKey};
}
