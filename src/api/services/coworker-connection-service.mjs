import {httpPost} from '../http-client.mjs';
import {ApiResponse} from '../models/api-response.mjs';

const CONNECT_PATH = '/v1/coworkers/connect';

function requiredText(value, label) {
  const text = String(value || '').trim();
  if (!text) throw new Error(`${label} is required`);
  return text;
}

function validateBaseUrl(value) {
  const baseURL = requiredText(value, 'baseURL');
  let parsed;
  try {
    parsed = new URL(baseURL);
  } catch {
    throw new Error('baseURL must be an HTTPS URL');
  }
  if (parsed.protocol !== 'https:') {
    throw new Error('baseURL must be an HTTPS URL');
  }
  return baseURL;
}

/**
 * Connects a Coworker to a provider and returns its one-time runtime key.
 * The provider API key is sent only to Core and is never persisted by the CLI.
 */
export async function connectCoworker(coworkerId, {
  organizationId,
  baseURL,
  providerApiKey,
  idempotencyKey,
  signal,
} = {}) {
  const payload = {
    coworkerId: requiredText(coworkerId, 'coworkerId'),
    organizationId: requiredText(organizationId, 'organizationId'),
    baseURL: validateBaseUrl(baseURL),
    providerApiKey: requiredText(providerApiKey, 'providerApiKey'),
    idempotencyKey: requiredText(idempotencyKey, 'idempotencyKey'),
  };

  const json = await httpPost(CONNECT_PATH, payload, {signal});
  const response = ApiResponse.from(json);
  return {response, connection: response.data};
}
