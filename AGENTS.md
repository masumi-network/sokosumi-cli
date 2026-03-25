# Sokosumi CLI - Agent Guidelines

> **Purpose**: This document provides comprehensive guidelines for AI agents (Claude, Cursor, etc.) working on the Sokosumi CLI upgrade project. Follow these rules to ensure consistency, quality, and smooth collaboration.

## Quick Start for Agents

When starting work on this project:

1. ✅ **Read STATUS.md** - Check current progress and active tasks
2. ✅ **Read IMPLEMENTATION_PLAN.md** - Understand the architecture
3. ✅ **Read CURSOR_RULES.md** - API layer conventions
4. ✅ **Check this file** - Follow coding standards below
5. ✅ **Update STATUS.md** - Mark tasks in_progress, then completed

## Core Principles

### 1. No Git Operations
**CRITICAL**: Do NOT perform any git operations unless explicitly requested by the user.

- ❌ Do NOT run `git commit`
- ❌ Do NOT run `git push`
- ❌ Do NOT run `git pull`
- ❌ Do NOT create branches
- ❌ Do NOT modify git config

**Why**: The user handles all git operations manually.

### 2. Follow Existing Patterns
This project has established conventions. Always:
- Review existing code before adding new features
- Match the style of surrounding code
- Reuse existing components and utilities
- Don't reinvent patterns that already exist

### 3. Update Status Actively
- Update `STATUS.md` when starting a task (mark `in_progress`)
- Update `STATUS.md` immediately after completing a task (mark `completed`)
- Add notes about blockers or issues as you encounter them
- Keep progress percentages updated

---

## Tech Stack

### Core Technologies
- **Runtime**: Node.js >= 18
- **Package Manager**: pnpm (pinned in `package.json` via `packageManager`, currently `pnpm@10.33.0`)
- **Module System**: ES Modules (`.mjs` extensions)
- **UI Framework**: React + Ink (terminal UI)
- **Language**: JavaScript (ES2022+)

### Key Dependencies
- `ink` (v4.4.1) - React for CLIs
- `react` (v18.3.1) - UI framework
- `chalk` (v5.3.0) - Terminal colors
- `dotenv` (v16.4.5) - Environment variables
- `@anthropic-ai/sdk` (v0.60.0) - AI features

### File Extensions
- **Always use `.mjs`** for all JavaScript files
- This ensures proper ES module handling

---

## Project Structure

### Directory Layout
```
sokosumi-cli/
├── bin/                    # CLI entry point
│   └── sokosumi.mjs
├── src/
│   ├── app.mjs            # Main application component
│   ├── auth/              # Authentication (NEW - Phase 1)
│   ├── sdk/               # SDK for integrations (NEW - Phase 4)
│   ├── api/               # API layer
│   │   ├── http-client.mjs
│   │   ├── models/        # Data models
│   │   └── services/      # API services
│   ├── components/        # Reusable UI components
│   ├── views/             # Screen/page components
│   └── utils/             # Helper utilities
└── examples/              # Integration examples (NEW - Phase 4)
```

### File Naming Conventions
- **Directories**: `kebab-case` (e.g., `auth-manager/`)
- **Files**: `kebab-case.mjs` (e.g., `auth-manager.mjs`)
- **Components**: PascalCase names, kebab-case files (e.g., `SelectInput` → `select-input.mjs`)
- **Services**: `entity-service.mjs` (e.g., `agent-service.mjs`)
- **Models**: `entity.mjs` (e.g., `agent.mjs`)

---

## Coding Standards

### JavaScript Style

#### Modern JavaScript (ES2022+)
```javascript
// ✅ Good - Use modern features
const items = [...array];
const {name, email} = user;
const result = await fetchData();

// ❌ Bad - Avoid old patterns
var items = array.slice();
var name = user.name;
```

#### Named Exports
```javascript
// ✅ Good - Named exports (preferred)
export class Agent { }
export function fetchAgents() { }

// ⚠️ Acceptable - Default export only for React components
export default function App() { }
```

#### Async/Await
```javascript
// ✅ Good - Use async/await
async function loadData() {
  try {
    const data = await fetchData();
    return data;
  } catch (error) {
    console.error('Failed to load:', error);
    throw error;
  }
}

// ❌ Bad - Avoid .then() chains
function loadData() {
  return fetchData()
    .then(data => data)
    .catch(err => console.error(err));
}
```

#### Destructuring
```javascript
// ✅ Good - Use destructuring
const {id, name} = agent;
const [first, ...rest] = items;

// ❌ Bad - Verbose property access
const id = agent.id;
const name = agent.name;
```

### React & Ink Patterns

#### Component Structure
```javascript
// ✅ Good - Functional component with hooks
import React, {useState, useEffect} from 'react';
import {Box, Text} from 'ink';

function MyView({onBack}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Text>Loading...</Text>;
  }

  return (
    <Box flexDirection="column">
      <Text>{data.title}</Text>
    </Box>
  );
}

export default MyView;
```

#### Using React.createElement (When Needed)
Sometimes JSX isn't available in the environment. Use `React.createElement`:

```javascript
// ✅ Acceptable - When JSX isn't available
return React.createElement(
  Box,
  {flexDirection: 'column'},
  React.createElement(Text, {color: 'blue'}, 'Hello')
);

// ✅ Preferred - When JSX is available
return (
  <Box flexDirection="column">
    <Text color="blue">Hello</Text>
  </Box>
);
```

#### Input Handling
```javascript
// ✅ Good - Use Ink's useInput hook
import {useInput} from 'ink';

function MyComponent() {
  useInput((input, key) => {
    if (key.escape) {
      // Handle escape
    }
    if (key.return) {
      // Handle enter
    }
  });
}
```

### API Layer Conventions

Follow the patterns in `CURSOR_RULES.md`:

#### Models
```javascript
// ✅ Good - Model with static factory
export class Agent {
  constructor({id, name, createdAt} = {}) {
    this.id = id ?? null;
    this.name = name ?? '';
    this.createdAt = createdAt ? new Date(createdAt) : null;
  }

  static from(input) {
    if (!input || typeof input !== 'object') {
      return new Agent({});
    }
    return new Agent(input);
  }
}
```

#### Services
```javascript
// ✅ Good - Service function
import {httpGet} from '../http-client.mjs';
import {ApiResponse} from '../models/api-response.mjs';
import {Agent} from '../models/agent.mjs';

export async function fetchAgent(id, {signal} = {}) {
  const json = await httpGet(`/agents/${id}`, {signal});
  const response = ApiResponse.from(json);
  const agent = Agent.from(response.data);
  return {response, agent};
}
```

#### HTTP Client Usage
```javascript
// ✅ Good - Use http-client.mjs
import {httpGet, httpPost} from '../api/http-client.mjs';

const data = await httpGet('/agents');
const result = await httpPost('/agents/123/jobs', {body: jobData});

// ❌ Bad - Direct fetch usage in UI
const response = await fetch(url);
```

### Error Handling

```javascript
// ✅ Good - Comprehensive error handling
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  // Log error with context
  console.error('Operation failed:', error.message);

  // Show user-friendly message
  setError(error?.message || 'Something went wrong');

  // Re-throw if needed
  throw error;
}

// ❌ Bad - Silent failures
try {
  await riskyOperation();
} catch (error) {
  // Nothing
}
```

### Environment Variables

```javascript
// ✅ Good - Use utils/env.mjs
import {getApiKeyFromEnv, getApiBaseUrlFromEnv} from './utils/env.mjs';

const apiKey = getApiKeyFromEnv();
const apiUrl = getApiBaseUrlFromEnv();

// ❌ Bad - Direct process.env access
const apiKey = process.env.SOKOSUMI_API_KEY;
```

---

## Component Guidelines

### View Components (Screens)
Views are full-screen components that represent different screens in the CLI.

**Location**: `src/views/`

**Pattern**:
```javascript
import React, {useState, useEffect} from 'react';
import {Box, Text, useInput} from 'ink';

function MyView({onBack}) {
  useInput((input, key) => {
    if (key.escape) {
      onBack();
    }
  });

  return (
    <Box flexDirection="column">
      <Text>My View Content</Text>
      <Text dimColor>Press Esc to go back</Text>
    </Box>
  );
}

export default MyView;
```

**Rules**:
- Always accept `onBack` prop for navigation
- Use `useInput` for keyboard shortcuts
- Show "Press Esc to go back" hint
- Fetch data in `useEffect`, not in render

### Reusable Components
Small, reusable UI pieces.

**Location**: `src/components/`

**Examples**: `SelectInput`, `TextInput`, `PixelLoader`

**Pattern**:
```javascript
import React from 'react';
import {Box, Text} from 'ink';

function StatusBadge({status}) {
  const color = status === 'completed' ? 'green' : 'yellow';
  return <Text color={color}>{status}</Text>;
}

export default StatusBadge;
```

---

## Authentication Implementation (Phase 1)

### Token Storage
Store tokens securely in user's home directory:

```javascript
// Location: ~/.sokosumi/credentials.json
{
  "authToken": "tok_abc123...",
  "refreshToken": "ref_xyz789...",
  "expiresAt": "2026-12-31T23:59:59Z",
  "userId": "user_123"
}
```

### Auth Manager Pattern
```javascript
// src/auth/auth-manager.mjs
export class AuthManager {
  constructor() {
    this.token = null;
    this.loadToken();
  }

  async loadToken() {
    // Load from ~/.sokosumi/credentials.json
  }

  async saveToken(token) {
    // Save to ~/.sokosumi/credentials.json
  }

  isAuthenticated() {
    return !!this.token && !this.isExpired();
  }

  isExpired() {
    // Check token expiration
  }

  async refreshToken() {
    // Refresh expired token
  }
}
```

### Magic Link Flow
```javascript
// src/auth/magic-link.mjs
export async function initiateMagicLink(email) {
  // POST /auth/login/email
  // Returns: { checkUrl, expiresIn }
}

export async function pollForToken(checkUrl) {
  // Poll GET /auth/session/verify
  // Returns token when user clicks link
}
```

---

## SDK Implementation (Phase 4)

### Client Pattern
```javascript
// src/sdk/client.mjs
export class SokosumiClient {
  constructor({authToken, apiUrl}) {
    this.authToken = authToken;
    this.apiUrl = apiUrl || 'https://api.sokosumi.com/v1';
  }

  async listAgents(filters = {}) {
    // Implementation
  }

  async hireAgent(agentId, inputs) {
    // Implementation
  }
}
```

### Usage by Plugins
```javascript
import {SokosumiClient} from 'sokosumi-cli/sdk';

const client = new SokosumiClient({
  authToken: process.env.SOKOSUMI_AUTH_TOKEN
});

const agents = await client.listAgents({category: 'research'});
```

---

## Testing Guidelines

### Manual Testing
For each feature you implement:

1. **Happy Path**: Test the main use case
2. **Error Cases**: Test with invalid input
3. **Edge Cases**: Test with empty/null values
4. **Navigation**: Test back buttons and escape key
5. **Loading States**: Verify loaders appear

### Testing Checklist
```bash
# Start the CLI
pnpm start

# Test each new feature:
- [ ] Feature appears in menu
- [ ] Feature loads without errors
- [ ] Data displays correctly
- [ ] User can navigate back
- [ ] Error messages are clear
- [ ] Loading states show
```

---

## Common Patterns

### Loading States
```javascript
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [data, setData] = useState(null);

useEffect(() => {
  async function load() {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchData();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  load();
}, []);

if (loading) return <PixelLoader label="Loading..." />;
if (error) return <Text color="red">{error}</Text>;
```

### Navigation Pattern
```javascript
// In app.mjs
const [mode, setMode] = useState('menu');
const [selectedItem, setSelectedItem] = useState(null);

// Navigate to view
const goToAgents = () => {
  setMode('agents');
};

// Navigate back
const goBack = () => {
  setMode('menu');
  setSelectedItem(null);
};

// In view component
function AgentsView({onBack}) {
  useInput((input, key) => {
    if (key.escape) onBack();
  });
}
```

### List Selection Pattern
```javascript
import SelectInput from './components/select-input.mjs';

const items = agents.map(agent => ({
  label: agent.name,
  value: agent.id
}));

function handleSelect(item) {
  // item.value is the selected ID
  setSelectedAgent(agents.find(a => a.id === item.value));
  setMode('agent-details');
}

<SelectInput items={items} onSelect={handleSelect} />
```

---

## Status Tracking Protocol

### Before Starting a Task
1. Open `STATUS.md`
2. Find the task in the relevant phase
3. Change `[ ]` to `[x]` if completing, or mark as "in_progress" in the phase status
4. Add your name/agent ID to "Current Work Items"

### After Completing a Task
1. Mark task as complete: `[x]`
2. Update phase progress percentage
3. Update "Current Work Items" → "Next Up"
4. Add notes about the implementation
5. Commit the STATUS.md update

### Example Status Update
```markdown
### Authentication System (🟡 In Progress - 40%)
- [x] Create `src/auth/` directory structure
- [x] Implement `auth-manager.mjs`
- [x] Implement `token-store.mjs`
- [ ] Implement `magic-link.mjs` ← Currently working on this
- [ ] Implement `session.mjs`

**Current Work**: Implementing magic link flow handler
**Blocker**: Need to confirm auth endpoint URL format with team
```

---

## Questions & Clarifications

### Before Implementing
If you're unsure about:
- API endpoint structure → Check `IMPLEMENTATION_PLAN.md` or ask team
- Existing patterns → Search codebase for similar features
- Design decisions → Check "Decisions Made" in `STATUS.md`

### Add to STATUS.md
Questions that need team input:
```markdown
### Questions for Team
1. ❓ What should the magic link URL format be?
2. ❓ Do we need to support refresh tokens?
```

---

## Do's and Don'ts

### ✅ Do
- Follow existing patterns
- Update STATUS.md actively
- Write clear error messages
- Test manually before marking complete
- Add comments for complex logic
- Use semantic variable names
- Handle edge cases

### ❌ Don't
- Use `git` commands (user handles this)
- Create new patterns without checking existing code
- Skip error handling
- Leave console.log statements
- Use synchronous operations for I/O
- Hardcode values (use constants/config)
- Forget to update STATUS.md

---

## Brand Guidelines

### Colors
Use the brand color: `#7F00FF` (purple)

```javascript
const BRAND_HEX = '#7F00FF';

<Text color={BRAND_HEX}>Sokosumi CLI</Text>
```

### ASCII Art
The project uses pixel art styling. See `logo_sokosumi_pixelart.txt` and `src/components/animated-logo.mjs`.

---

## References

### Internal Documents
- `IMPLEMENTATION_PLAN.md` - Architecture and design
- `STATUS.md` - Current progress tracking
- `CURSOR_RULES.md` - API layer conventions
- `CHANGELOG.md` - Version history

### External References
- [Ink Documentation](https://github.com/vadimdemedes/ink)
- [React Hooks](https://react.dev/reference/react)
- [ES Modules](https://nodejs.org/api/esm.html)

### Reference Repositories
- `../soko-mpp-gateway/` - Payment gateway implementation
- `../sokosumi/` - Main marketplace monorepo

---

## Agent Handoff Protocol

When you're done working and another agent will continue:

1. **Update STATUS.md**
   - Mark current progress
   - Add notes about what you completed
   - List what's next

2. **Document Issues**
   - Add any blockers to "Known Issues & Risks"
   - Add questions to "Questions for Team"

3. **Clean Up**
   - Remove debugging code
   - Ensure code runs without errors
   - Leave clear comments for complex sections

4. **Commit Message** (user will commit, but document)
   ```
   Add suggested commit message in STATUS.md:

   feat(auth): implement token storage and auth manager

   - Created auth-manager.mjs for token management
   - Implemented secure token storage in ~/.sokosumi/
   - Added backward compatibility with API keys

   Progress: Phase 1 - 40% complete
   ```

---

## Quick Reference Commands

```bash
# Install dependencies
pnpm install

# Start CLI
pnpm start

# Check for issues
pnpm start  # Should run without errors

# Environment setup
cp .env.example .env
# Edit .env with your keys
```

---

## Contact & Support

- **Project Lead**: Check with user
- **API Questions**: Check Sokosumi API docs
- **Blockers**: Document in STATUS.md "Questions for Team" section

---

**Document Version**: 1.0
**Last Updated**: 2026-03-24
**For**: AI Agents working on Sokosumi CLI upgrade
