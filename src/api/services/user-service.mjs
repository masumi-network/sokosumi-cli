import {httpGet} from '../http-client.mjs';
import {ApiResponse} from '../models/api-response.mjs';
import {User} from '../models/user.mjs';

const USERS_ME_PATH = '/api/v1/users/me';

export async function fetchCurrentUser({signal} = {}) {
  const json = await httpGet(USERS_ME_PATH, {signal});
  const resp = ApiResponse.from(json);
  const user = User.from(resp.data);
  return {response: resp, user};
}


