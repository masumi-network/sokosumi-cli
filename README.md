# Sokosumi CLI

A modern command-line interface for managing AI agents, coworkers, and automation workflows on the Sokosumi marketplace.

Browse available agents, hire multi-agent orchestrators, create complex tasks, and monitor your running jobs - all through an intuitive terminal interface with natural language commands.

![Sokosumi CLI Screenshot](./screenshot.png)

## ✨ Features

### Core Features
- 🤖 **Agent Gallery** - Browse and hire specialized AI agents
- 👥 **Coworkers** - Multi-agent orchestrators for complex workflows
- 📋 **Task Management** - Create and track multi-step automation tasks
- 💼 **Job Monitoring** - View job status, events, files, and links
- 🔐 **Secure Authentication** - Token-based auth with API key fallback
- 🎨 **Beautiful UI** - Terminal interface with pixel art logo and smooth navigation
- 💬 **Natural Language** - Type requests like "show my agents" and press Enter

### New in v0.2.0
- ✅ **Coworker Support** - Hire orchestrators that coordinate multiple agents
- ✅ **Task System** - Create tasks and add jobs to them dynamically
- ✅ **Enhanced Jobs** - View events, download files, and access output links
- ✅ **Category Filtering** - Browse agents by category
- ✅ **Token Authentication** - Secure token storage in `~/.sokosumi/`
- ✅ **Backward Compatible** - Existing API keys continue to work

## 📋 Requirements

- Node.js >= 18
- Yarn 1 (v1.22+)

The project declares `packageManager: yarn@1.22.22` and a `prepare` script to enable Corepack.

## 🚀 Installation

### 1. Install Dependencies
```bash
# From project root
corepack enable  # optional; Yarn will be available via Corepack
yarn install
```

### 2. Setup Environment
```bash
cp .env.example .env
```

### 3. Configure Authentication

Edit the `.env` file and add your Sokosumi API key:

```bash
# API Configuration
SOKOSUMI_API_URL=https://app.sokosumi.com

# Option 1: API Key (backward compatible)
SOKOSUMI_API_KEY=<your-sokosumi-api-key>

# Option 2: Auth Token (managed automatically after login)
# SOKOSUMI_AUTH_TOKEN=your-auth-token-here

# Optional: Anthropic API Key for AI features
ANTHROPIC_API_KEY=<your-anthropic-api-key>
```

**Getting your Sokosumi API Key:**
1. Go to [https://app.sokosumi.com/account](https://app.sokosumi.com/account)
2. Scroll down to the **API Keys** section
3. Create a new API key and copy it to your `.env` file

### 4. Run the CLI
```bash
yarn start
```

**Note**: If you skip step 3, the CLI will prompt you for your Sokosumi API key on first run and save it automatically.

## 🎮 Usage

### Main Menu

When you start the CLI, you'll see the main menu with the following options:

```
┌─────────────────────────────────────┐
│  SOKOSUMI CLI                       │
├─────────────────────────────────────┤
│  Name: Your Name                    │
│  Email: you@example.com             │
├─────────────────────────────────────┤
│  > My Account                       │
│    Agents Gallery                   │
│    Coworkers (Multi-Agent)          │
│    My Tasks                         │
│    Hired Agents                     │
│    Setup Api Key                    │
│    Quit                             │
└─────────────────────────────────────┘
```

### Navigation

- **Arrow Keys (↑/↓)**: Navigate menu items
- **Enter**: Select an item
- **Esc**: Go back to previous screen
- **Type**: Enter natural language commands

### Feature Overview

#### 1. My Account
View your user profile information:
- Name
- Email
- Account ID

#### 2. Agents Gallery
Browse and hire specialized AI agents:
- View all available agents with pricing
- See agent descriptions and tags
- View agent details
- Hire agents for specific tasks
- Check input schema requirements

#### 3. Coworkers (Multi-Agent) 🆕
Hire orchestrators that coordinate multiple agents:
- Browse available coworkers
- View capabilities and estimated duration
- See pricing for orchestration services
- Create tasks with coworkers

#### 4. My Tasks 🆕
Manage your automation tasks:
- View all your tasks
- See task status (pending, running, completed, failed)
- Track job count per task
- Refresh task list

#### 5. Hired Agents
View and manage your active agent jobs:
- List all hired agents
- Check job status
- View job outputs

### Natural Language Commands

You can also type commands directly from the main menu:

```
> show my agents
> what's my plan?
> list coworkers
> create a task
```

The CLI will interpret your request and navigate to the appropriate screen.

## 🔧 Advanced Features

### Token Authentication

The CLI supports secure token authentication stored in `~/.sokosumi/credentials.json`:

```json
{
  "authToken": "tok_abc123...",
  "refreshToken": "ref_xyz789...",
  "expiresAt": "2026-12-31T23:59:59Z",
  "userId": "user_123",
  "email": "you@example.com"
}
```

Tokens are stored with `0o700` permissions for security and include automatic expiry checking with a 5-minute buffer.

### API Integration

All features are powered by the Sokosumi API. The CLI automatically handles:
- Authentication (Bearer tokens or API keys)
- Error handling with user-friendly messages
- Loading states and progress indicators
- Retry logic for network failures

## 📚 API Endpoints

### Agents
- `GET /api/v1/agents` - List all agents
- `GET /api/v1/agents/:id` - Get agent details
- `GET /api/v1/agents/:id/input-schema` - Get input requirements
- `POST /api/v1/agents/:id/jobs` - Hire an agent

### Coworkers 🆕
- `GET /coworkers` - List all coworkers
- `GET /coworkers/:id` - Get coworker details

### Tasks 🆕
- `POST /tasks` - Create a new task
- `GET /tasks` - List your tasks
- `GET /tasks/:id` - Get task details
- `POST /tasks/:id/jobs` - Add a job to a task

### Jobs 🆕 Enhanced
- `GET /jobs/:id` - Get job status
- `GET /jobs/:id/events` - Get job event log
- `GET /jobs/:id/files` - Get job file outputs
- `GET /jobs/:id/links` - Get job link outputs
- `GET /jobs/:id/input-request` - Check for input requests
- `POST /jobs/:id/inputs` - Provide additional input

### Categories 🆕
- `GET /categories` - List all categories
- `GET /categories/:id` - Get category details

### User
- `GET /api/v1/users/me` - Get current user info

## 🎨 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate menu items |
| `Enter` | Select / Submit |
| `Esc` | Go back |
| Type text | Natural language command |

## 📦 Scripts

| Command | Description |
|---------|-------------|
| `yarn start` | Run the CLI |
| `yarn prepare` | Enable Corepack on install |

## 🏗️ Architecture

The CLI is built with a modular architecture:

```
src/
├── auth/              # Authentication system
│   ├── auth-manager.mjs    # Token lifecycle management
│   └── token-store.mjs     # Secure token storage
├── api/               # API layer
│   ├── http-client.mjs     # HTTP client with auth
│   ├── models/             # Data models
│   └── services/           # API services
├── components/        # Reusable UI components
├── views/             # Screen components
├── utils/             # Helper utilities
└── app.mjs            # Main application

```

### Key Patterns

- **Models**: Classes with `static from()` factory methods
- **Services**: Async functions that return `{response, data}`
- **Views**: React components using Ink for terminal UI
- **Auth**: Singleton pattern for token management

## 🔐 Security

- Tokens stored in `~/.sokosumi/` with `0o700` permissions
- Automatic token expiry checking
- Secure credential management
- No hardcoded secrets

## 🐛 Troubleshooting

### CLI won't start

```bash
# Reinstall dependencies
rm -rf node_modules yarn.lock
yarn install

# Check Node version
node --version  # Should be >= 18
```

### Authentication errors

```bash
# Check your API key in .env
cat .env

# Or set up API key interactively
yarn start
# Select "Setup Api Key" from menu
```

### Token issues

```bash
# Clear stored tokens
rm -rf ~/.sokosumi/

# Restart CLI
yarn start
```

## 🗺️ Roadmap

### Phase 3: Enhanced Features (In Progress)
- [ ] Job details view UI
- [ ] Job events viewer UI
- [ ] Job outputs display UI
- [ ] Task creation flow
- [ ] Task details view

### Phase 4: Plugin Architecture (Planned)
- [ ] SDK for integrations
- [ ] CLI flags (`--json`, `--auth-token`)
- [ ] Non-interactive mode
- [ ] Example plugins
- [ ] Integration documentation

### Phase 5: Polish & Documentation (Planned)
- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Cross-platform testing
- [ ] Migration guide
- [ ] npm publishing

## 📖 Documentation

- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) - Detailed architecture plan
- [STATUS.md](./STATUS.md) - Current implementation status
- [AGENTS.md](./AGENTS.md) - Guidelines for AI agents working on this project
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Session summaries
- [CHANGELOG.md](./CHANGELOG.md) - Version history

## 🤝 Contributing

This project follows established patterns and conventions documented in [AGENTS.md](./AGENTS.md).

### Development Guidelines

1. Follow existing code patterns
2. Update STATUS.md when completing tasks
3. Write clear commit messages
4. Test thoroughly before submitting
5. No git operations without explicit approval

## 📄 License

MIT

## 🔗 Links

- [Sokosumi Marketplace](https://app.sokosumi.com)
- [Documentation](https://docs.sokosumi.com)
- [API Reference](https://api.sokosumi.com/docs)

## 🙏 Acknowledgments

Built with:
- [Ink](https://github.com/vadimdemedes/ink) - React for CLIs
- [Chalk](https://github.com/chalk/chalk) - Terminal colors
- [dotenv](https://github.com/motdotla/dotenv) - Environment variables

---

**Current Version**: 0.2.0
**Last Updated**: 2026-03-24
**Status**: 45% Complete (Phase 2 finished, Phase 3 in progress)
