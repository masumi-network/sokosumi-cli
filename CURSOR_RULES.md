## Cursor Rules — API Layer and Screen Implementation

These rules standardize how to add API endpoints and wire them into screens.

### Environment
- **Primary config**: `SOKOSUMI_API_URL`
- **Authentication sources**:
  - `SOKOSUMI_AUTH_TOKEN`
  - `SOKOSUMI_API_KEY`
  - `~/.sokosumi/config.json` and `~/.sokosumi/credentials.json` via `src/utils/env.mjs`
- **Access**:
  - Load once via `loadEnvFromLocalFile()` from `src/utils/env.mjs`.
  - Read using `getApiBaseUrlFromEnv()`, `getApiKeyFromEnv()`, and auth-manager helpers when needed.

### HTTP Client
- Use `src/api/http-client.mjs` for all requests. Do not use `fetch` directly in UI/components.
- Paths are appended to `SOKOSUMI_API_URL` with clean slash handling.
- The shared client always sends `Authorization: Bearer <token-or-api-key>` plus `content-type: application/json`.
- The client prefers auth tokens over API keys when both exist.
- Auth-specific helpers such as `src/auth/magic-link.mjs` may use `fetch` directly when they are handling pre-auth flows.
- Errors:
  - Non-2xx responses throw with `status` and parsed `body` (if JSON) on the `Error`.
  - JSON parse failures throw with `cause`, `status`, and raw `body`.

### Response Wrapper
- Use `ApiResponse` (`src/api/models/api-response.mjs`) to represent standard API envelope `{ success, data, timestamp }`.
- Services should parse raw JSON to `ApiResponse` before mapping to models.

### Models
- Location: `src/api/models/{entity}.mjs`
- Export a class named after the entity (PascalCase) with a static `from(input)` factory.
- Parse dates into `Date` objects.
- Default missing fields to sensible null/boolean defaults.

Example model skeleton:
```javascript
// src/api/models/thing.mjs
export class Thing {
  constructor({id, createdAt} = {}) {
    this.id = id ?? null;
    this.createdAt = createdAt ? new Date(createdAt) : null;
  }

  static from(input) {
    if (!input || typeof input !== 'object') return new Thing({});
    return new Thing(input);
  }
}
```

### Services
- Location: `src/api/services/{entity}-service.mjs`
- Each function corresponds to a specific endpoint.
- Use the shared HTTP client; map to `ApiResponse` then to models.
- Return plain objects with the model and original `ApiResponse` when useful.

Example service skeleton (GET):
```javascript
// src/api/services/thing-service.mjs
import {httpGet} from '../http-client.mjs';
import {ApiResponse} from '../models/api-response.mjs';
import {Thing} from '../models/thing.mjs';

const THING_PATH = '/v1/things/:id';

export async function fetchThing(id, {signal} = {}) {
  const path = THING_PATH.replace(':id', encodeURIComponent(id));
  const json = await httpGet(path, {signal});
  const resp = ApiResponse.from(json);
  const thing = Thing.from(resp.data);
  return {response: resp, thing};
}
```

### Exports
- Re-export public APIs from `src/api/index.mjs`.
- Keep UI imports limited to `src/api/index.mjs`.

### UI/Screen Usage
- Fetch data in container/controller code and pass models into components.
- Do not mix HTTP calls into UI components; keep them in services.

Usage example:
```javascript
import {fetchThing} from '../api/index.mjs';

const {thing} = await fetchThing('abc123');
```

### Naming & Style
- Models: PascalCase class names; `static from()` constructor.
- Services: `fetchX`, `createX`, `updateX`, `deleteX` verb-based names.
- Files: `kebab-case` for filenames.
- Convert timestamp strings to `Date` in models.

### Checklist for Adding a New Endpoint/Screen
1. Ensure config resolution is clear: `.env`, `~/.sokosumi/config.json`, or `~/.sokosumi/credentials.json`.
2. Define or update a model in `src/api/models/` with `static from()` and date parsing.
3. Add a service in `src/api/services/` that calls the endpoint via `httpGet` (or future `httpPost`/etc.).
4. Wrap the result with `ApiResponse.from` and map to your model.
5. Export from `src/api/index.mjs`.
6. Use the service in the screen container and pass the model to UI components.
7. If the change affects workflow or auth behavior, review `skills/sokosumi/SKILL.md` and keep it aligned.
8. Run `pnpm run smoke:imports` and basic manual execution to confirm no errors.

### Reference — Implemented My Account
- Endpoint: `/v1/users/me`
- Files:
  - `src/api/models/user.mjs` (User model)
  - `src/api/services/user-service.mjs` (`fetchCurrentUser()`)
  - `src/api/index.mjs` re-exports
