import {httpGet} from '../http-client.mjs';
import {ApiResponse} from '../models/api-response.mjs';
import {Category} from '../models/category.mjs';

const CATEGORIES_PATH = '/v1/categories';

/**
 * Fetches all agent categories
 * @param {Object} options
 * @param {AbortSignal} [options.signal] - Abort signal
 * @returns {Promise<{response: ApiResponse, categories: Category[]}>}
 */
export async function fetchCategories({signal} = {}) {
  const json = await httpGet(CATEGORIES_PATH, {signal});
  const resp = ApiResponse.from(json);
  const list = Array.isArray(resp.data) ? resp.data : [];
  const categories = list.map(Category.from);
  return {response: resp, categories};
}

/**
 * Fetches a specific category by ID or slug
 * @param {string} categoryIdOrSlug - Category ID or slug
 * @param {Object} options
 * @param {AbortSignal} [options.signal] - Abort signal
 * @returns {Promise<{response: ApiResponse, category: Category}>}
 */
export async function fetchCategory(categoryIdOrSlug, {signal} = {}) {
  if (!categoryIdOrSlug) throw new Error('categoryIdOrSlug is required');
  const json = await httpGet(`${CATEGORIES_PATH}/${categoryIdOrSlug}`, {signal});
  const resp = ApiResponse.from(json);
  const category = Category.from(resp.data);
  return {response: resp, category};
}
