import {httpGet} from '../http-client.mjs';
import {ApiResponse} from '../models/api-response.mjs';
import {Coworker} from '../models/coworker.mjs';

const COWORKERS_PATH = '/v1/coworkers';

/**
 * Fetches all available coworkers
 * @param {Object} options
 * @param {AbortSignal} [options.signal] - Abort signal
 * @returns {Promise<{response: ApiResponse, coworkers: Coworker[]}>}
 */
export async function fetchCoworkers({signal} = {}) {
  const json = await httpGet(COWORKERS_PATH, {signal});
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
