import {httpGet} from '../http-client.mjs';
import {ApiResponse} from '../models/api-response.mjs';

const VENDORS_PATH = '/v1/vendors';
/**
 * Lists every vendor known to the platform (a global directory, not the
 * caller's memberships). Use it to look up the vendorId for a coworker you are
 * authorized to create. Creating a coworker requires a platform-admin key.
 * @param {Object} options
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<{response: ApiResponse, vendors: Array}>}
 */
export async function fetchVendors({signal} = {}) {
  const json = await httpGet(VENDORS_PATH, {signal});
  const response = ApiResponse.from(json);
  const vendors = Array.isArray(response.data) ? response.data : [];
  return {response, vendors};
}

const VENDORS_ME_PATH = '/v1/vendors/me';

/**
 * Lists vendors where the authenticated user is a member, with membership role.
 * This carries an authorization signal that the global vendor directory lacks.
 * @param {Object} options
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<{response: ApiResponse, vendors: Array}>}
 */
export async function fetchMyVendors({signal} = {}) {
  const json = await httpGet(VENDORS_ME_PATH, {signal});
  const response = ApiResponse.from(json);
  const vendors = Array.isArray(response.data) ? response.data : [];
  return {response, vendors};
}
