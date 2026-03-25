# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-03-24

### Fixed (Critical Bug Fix Sessions 2 & 3)
#### Issue 1: API Connection - Agents Gallery & User Info
- **Fixed API URL**: Changed from `https://preprod.sokosumi.com` to `https://api.preprod.sokosumi.com`
- **Fixed API Paths**: Changed from `/api/v1/*` to `/v1/*` to match OpenAPI specification
- **Fixed Authentication**: Changed from `x-api-key` header to `Authorization: Bearer` per OpenAPI security scheme

#### Issue 2: Missing `/v1` Prefix - Coworkers, Tasks, Categories
- **Fixed Coworker Service**: Changed path from `/coworkers` to `/v1/coworkers`
- **Fixed Task Service**: Changed path from `/tasks` to `/v1/tasks`
- **Fixed Job Service**: Changed path from `/jobs` to `/v1/jobs`
- **Fixed Category Service**: Changed path from `/categories` to `/v1/categories`

#### Issue 3: Incorrect "My Jobs" Implementation
- **Wrong Approach**: Was fetching ALL agents then looping through jobs for each agent
- **Correct Approach**: Now fetches user's jobs directly via `GET /v1/jobs`
- **Added `fetchJobs()`**: New function in `job-service.mjs` to list all user jobs
- **Rewrote View**: `hired-agents-view.mjs` completely rewritten to show jobs (not agents)
- **UI Improvements**:
  - Color-coded status badges (green=completed, red=failed, yellow=running)
  - Job result display with markdown rendering
  - Clearer messaging when no jobs exist
  - Renamed menu item: "Hired Agents" → "My Jobs"
- **Fixed Double Rendering**: Added `ClearScreen` component to main menu

**Files Modified**:
- `.env` - API URL correction
- `.env.example` - Documentation and examples
- `src/api/http-client.mjs` - Bearer token authentication (src/api/http-client.mjs:39)
- `src/api/services/agent-service.mjs` - Path fix `/v1/agents` (src/api/services/agent-service.mjs:6)
- `src/api/services/user-service.mjs` - Path fix `/v1/users/me` (src/api/services/user-service.mjs:5)
- `src/api/services/coworker-service.mjs` - Path fix `/v1/coworkers` (src/api/services/coworker-service.mjs:5)
- `src/api/services/task-service.mjs` - Path fix `/v1/tasks` (src/api/services/task-service.mjs:5)
- `src/api/services/job-service.mjs` - Path fix `/v1/jobs` + added `fetchJobs()` (src/api/services/job-service.mjs:7,15)
- `src/api/services/category-service.mjs` - Path fix `/v1/categories` (src/api/services/category-service.mjs:5)
- `src/api/index.mjs` - Exports `fetchJobs`
- `src/views/hired-agents-view.mjs` - Complete rewrite (now shows jobs properly)
- `src/app.mjs` - Menu rename + ClearScreen fix (src/app.mjs:111,433)

**Impact**: All endpoints now working correctly. Workflow matches Sokosumi web app.

#### Issue 4: Task Creation Not Implemented
- **Problem**: Clicking "Create Task with this Coworker" threw `ReferenceError: alert is not defined`
- **Fix**: Implemented full task creation workflow
  - Created `src/views/create-task-view.mjs` - Interactive task creation form
  - Two-step flow: 1) Enter task name (required), 2) Enter description (optional)
  - Automatically assigns selected coworker to task
  - Shows success/error feedback
  - Navigates to "My Tasks" after creation
- **Files Created**:
  - `src/views/create-task-view.mjs` - New task creation view
- **Files Modified**:
  - `src/app.mjs` - Added createTask mode, removed alert() call (src/app.mjs:95,149,411,423)

**Impact**: Task creation now fully functional. Can create tasks for coworkers.

#### Issue 5: Live Task Monitoring Dashboard
- **Request**: "I think it's better to have like the task can keep running in the background. And we can come back here and everything. Also we can have something like a history or like tasks in tasks something. So we can see what's tasks... we can have like a dashboard... make it like a boomerang terminal."
- **Solution**: Implemented live monitoring dashboard with real-time updates
  - Created `src/views/dashboard-view.mjs` - Live task dashboard with auto-refresh
  - **Real-time polling** - Updates every 5 seconds automatically
  - **Status indicators**:
    - Animated pixel loader for running tasks
    - Color-coded status badges (✓ green=completed, ✗ red=failed, ◉ yellow=running)
    - Border color changes based on status
  - **Input request detection** - Tasks needing input show red border with 🔔 INPUT NEEDED alert
  - **Background polling** - Checks all running jobs for input requests automatically
  - **Manual refresh** - Press 'R' to force refresh
  - **Task history** - Shows all tasks (draft, running, completed, failed)
  - **Added to main menu** - "📊 Dashboard (Live Tasks)" is first menu item
  - **Navigation flow** - Create task → Auto-redirect to dashboard → See it running live
- **Files Created**:
  - `src/views/dashboard-view.mjs` - Live monitoring dashboard (155 lines)
- **Files Modified**:
  - `src/app.mjs` - Added dashboard mode and menu item (src/app.mjs:21,96,109,127,424,441)
  - `src/api/services/task-service.mjs` - Added `fetchTaskEvents()` (src/api/services/task-service.mjs:92)

**Impact**:
- Tasks run in background on server while you continue working
- No need to wait for 10-20 minute tasks - create and move on
- Visual feedback for all task statuses
- Immediate notification when tasks need input (human-in-the-loop)
- Boomerang-style terminal dashboard with live animations

#### Issue 6: UX Improvements Based on User Feedback
- **Problem 1**: Tasks created with DRAFT status, stuck in backlog, never start automatically
  - **Fix**: Changed `createTask()` to set `status: 'READY'` by default so tasks start immediately
  - File: `src/views/create-task-view.mjs:41`

- **Problem 2**: Confusing coworker selection flow - shows dropdown "Create Task with this Coworker" but nothing happens
  - **Fix**: Simplified flow - selecting a coworker directly opens task creation
  - Removed redundant "Create Task with this Coworker" sub-menu item
  - File: `src/views/coworkers-view.mjs:48-64`

- **Problem 3**: Dashboard showing too many old drafts (cancelled/completed tasks)
  - **Fix**: Added smart filtering to dashboard:
    - Shows tasks with running/pending jobs
    - Shows tasks completed/failed in last 24 hours
    - Hides old drafts (>24 hours with no jobs)
  - File: `src/views/dashboard-view.mjs:33-73`

- **Problem 4**: Task selection below dashboard leads to blank screen
  - **Fix**: Removed non-functional task selection menu
  - Dashboard is now view-only (read-only monitoring)
  - File: `src/views/dashboard-view.mjs:225`

- **Problem 5**: Task name 120 char limit unclear
  - **Fix**: Improved UX with clearer messaging:
    - Shows "Task Name (required, max 120 chars)" header
    - Explains "Keep it short - you can add full details in the next step"
    - Description field shows "(optional, no limit)"
    - Character counter turns red when over limit
  - File: `src/views/create-task-view.mjs:67-102`

**Impact**:
- Tasks now start immediately when created (READY status, not DRAFT)
- Simplified coworker workflow - one click to create task
- Dashboard shows only active/recent tasks (no clutter)
- Clearer guidance on task name vs description fields

#### Issue 7: Unsupported Input Types When Hiring Agents
- **Problem**: Agents showed "Unsupported field type" for all input fields except textarea
- **Root Cause**: hire-agent-view.mjs only supported `textarea` type, rejected `none`, `string`, `text`
- **Fix**: Added support for all standard input types:
  - `none` - No input required, shows description only
  - `string` - Single-line text input
  - `text` - Multi-line text input
  - Shows clear message for truly unsupported types
- **Files Modified**:
  - `src/views/hire-agent-view.mjs:105-135` - Added type checking and proper rendering
- **Impact**: All agents with standard input schemas now work correctly

#### Issue 8: Missing File and Image Display in Job Results
- **Problem**: Stock photo agents and image agents return files, but CLI only showed text results
- **Root Cause**: hired-agents-view.mjs didn't fetch or display job files/links
- **Fix**: Implemented comprehensive file and link display:
  - Fetches files via `GET /v1/jobs/:id/files` when viewing job details
  - Fetches links via `GET /v1/jobs/:id/links` when viewing job details
  - Displays files with: name, type, size, download URL
  - Displays links with: title, description, URL
  - Shows loading indicator while fetching
  - Provides copy-paste URLs for viewing/downloading
- **Files Modified**:
  - `src/views/hired-agents-view.mjs:1,10-17,72-95,97-101,161-201` - Added file/link fetching and display
  - `src/api/models/job-output.mjs:1-19` - Enhanced JobFile model with fileUrl/sourceUrl handling
- **Impact**: Images, PDFs, videos, and other file outputs now properly displayed with download URLs

### Added
#### Authentication System
- Token-based authentication with secure storage in `~/.sokosumi/credentials.json`
- `src/auth/auth-manager.mjs` - Singleton pattern for token lifecycle management
- `src/auth/token-store.mjs` - Secure token storage with 0o700 permissions
- Token expiry checking with 5-minute buffer
- Bearer token authentication support in HTTP client
- Backward compatibility with existing API key authentication

#### Coworker Support (Phase 2)
- **New menu item**: "Coworkers (Multi-Agent)" for multi-agent orchestrators
- `src/api/models/coworker.mjs` - Coworker and CoworkerPrice models
- `src/api/services/coworker-service.mjs` - List and fetch coworkers
- `src/views/coworkers-view.mjs` - Browse coworkers with capabilities
- `src/views/coworker-details-view.mjs` - Detailed coworker information
- Support for coworker orchestration workflows

#### Task Management (Phase 2)
- **New menu item**: "My Tasks" for task tracking
- `src/api/models/task.mjs` - Task and TaskJob models
- `src/api/services/task-service.mjs` - Create, list, and manage tasks
- `src/views/tasks-view.mjs` - List user tasks with status badges
- Task creation with coworker assignment
- Add jobs to existing tasks

#### Enhanced Job Features (Phase 3 - API Layer)
- `src/api/services/job-service.mjs` - Enhanced job operations
- `src/api/models/job-event.mjs` - Job event tracking
- `src/api/models/job-output.mjs` - JobFile and JobLink models
- Support for job events, file outputs, and link outputs
- Interactive job input request handling
- Job event log retrieval

#### Category Support (Phase 3)
- `src/api/models/category.mjs` - Category model
- `src/api/services/category-service.mjs` - List and fetch categories
- Agent categorization support

#### API Enhancements
- HTTP PATCH and DELETE methods in `http-client.mjs`
- Updated `src/api/index.mjs` with all new exports
- Comprehensive error handling with user-friendly messages
- Clear authentication error messages guiding users to login

### Changed
- Updated `src/api/http-client.mjs` to prefer Bearer tokens over API keys
- Enhanced main menu with new sections (Coworkers, My Tasks)
- Improved navigation with Esc key support for new views
- Updated `.env.example` with token authentication documentation

### Documentation
- Created `IMPLEMENTATION_PLAN.md` - Comprehensive 5-phase upgrade plan
- Created `STATUS.md` - Real-time progress tracking (45% complete)
- Created `AGENTS.md` - 600+ line developer guidelines for AI agents
- Created `IMPLEMENTATION_SUMMARY.md` - Session implementation summary
- Updated `README.md` - Complete feature documentation with examples
- Updated `CHANGELOG.md` - This file

### API Endpoints
#### New Endpoints
- `GET /coworkers` - List all coworkers
- `GET /coworkers/:id` - Get coworker details
- `POST /tasks` - Create a new task
- `GET /tasks` - List user's tasks
- `GET /tasks/:id` - Get task details
- `POST /tasks/:id/jobs` - Add job to task
- `GET /categories` - List all categories
- `GET /categories/:id` - Get category details
- `GET /jobs/:id/events` - Get job event log
- `GET /jobs/:id/files` - Get job file outputs
- `GET /jobs/:id/links` - Get job link outputs
- `GET /jobs/:id/input-request` - Check for input requests
- `POST /jobs/:id/inputs` - Provide additional input

### Technical
- All new code follows existing patterns and conventions
- Production-grade error handling throughout
- Comprehensive JSDoc annotations for IDE support
- Modular architecture with clean separation of concerns
- Zero breaking changes - full backward compatibility maintained

### Progress
- **Phase 1 (Foundation)**: ✅ 100% Complete
- **Phase 2 (Coworker Support)**: ✅ 100% Complete
- **Phase 3 (Enhanced Features)**: 🟡 30% Complete (API layer done, UI pending)
- **Phase 4 (Plugin Architecture)**: ⚪ Not Started
- **Phase 5 (Polish & Documentation)**: ⚪ Not Started
- **Overall**: 45% Complete

### Notes
- Task creation flow has TODO placeholder for full implementation
- Task details view has TODO placeholder for full implementation
- Job details/events/outputs UI views planned for next phase
- Magic link authentication requires backend API implementation

---

## [0.1.0] - 2025-08-15

### Added
- Initial Ink + React CLI scaffold with animated intro from `logo_sokosumi_pixelart.txt` (line-by-line)
- First-run setup to capture and store `SOKOSUMI_API_KEY` in `.env`
- Main menu: My Account, Agents, Jobs, Quit
- Natural language prompt with Escape to return
- Custom `SelectInput` and `TextInput` components to avoid plugin conflicts
- Migrated to Yarn; added `packageManager` and `prepare` script
- Added README and MIT License
