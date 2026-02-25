# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Training Memo - a workout tracking web application for recording exercises, sets/reps/weight, body weight, and viewing training statistics. Japanese-language UI.

## Development Environment

All services run via Docker Compose. No local Go or Node.js installation required.

```bash
make up-build          # Build and start all containers
make down              # Stop containers
make down-volumes      # Stop and delete volumes (resets DB)
make logs              # Tail all logs
make logs-backend      # Tail backend logs only
make logs-frontend     # Tail frontend logs only
```

### Service Ports

| Service  | Host Port | Container Port |
|----------|-----------|----------------|
| Frontend | 3001      | 3000           |
| Backend  | 8081      | 8080           |
| DB       | 5432      | 5432           |

### Database

PostgreSQL 16. Migrations run automatically on `docker compose up` via the `migrate` service. Manual migration commands:

```bash
make migrate-up
make migrate-down                              # Rolls back 1 migration
make migrate-create name=create_xxx_table      # Create new migration files
```

Migration files live in `db/migrations/` using golang-migrate sequential numbering (`000001_`, `000002_`, etc.).

**Note:** The Makefile's `db-shell` and migrate commands reference MySQL connection strings, but the actual database is PostgreSQL (see `docker-compose.yml`). Use `docker compose exec db psql -U training_user -d training_memo` for DB shell access.

## Build & Test Commands

### Backend (Go 1.23, Echo v4, GORM)

```bash
# Run inside container:
make backend-shell

# Build
go build -o ./tmp/main ./cmd/server

# Run all tests
go test ./...

# Run tests for a specific package
go test ./internal/service/...
go test ./internal/handler/...

# Run a single test
go test ./internal/service/ -run TestFunctionName
```

Hot reload is handled by Air (`.air.toml`). Backend rebuilds automatically on `.go` file changes inside the container.

### Frontend (Next.js 15, TypeScript, Tailwind CSS)

```bash
# Run inside container:
make frontend-shell

npm run dev            # Dev server (runs automatically in container)
npm run build          # Production build
npm run lint           # ESLint

# Cloudflare Pages deployment
npm run pages:build    # Build via @cloudflare/next-on-pages
npm run pages:deploy   # Build + deploy to Cloudflare Pages
```

No test runner is currently configured for the frontend.

## Architecture

### Backend: 3-Layer Architecture

```
cmd/server/main.go          # Entry point, route registration, DI wiring
internal/
  handler/                   # HTTP handlers (request parsing, response formatting)
  service/                   # Business logic
  repository/                # Database access (GORM)
  model/                     # Domain models (GORM structs)
  middleware/                 # JWT auth middleware
```

All dependencies are wired in `main.go`: repositories -> services -> handlers. No dependency injection framework.

Authentication uses JWT Bearer tokens. Public endpoints: `/api/v1/auth/register`, `/api/v1/auth/login`, `/health`. All other endpoints require the `AuthMiddleware`.

### Frontend: Next.js App Router

```
src/
  app/                       # Pages (App Router)
  components/                # Shared UI components
  hooks/useAuth.ts           # Auth state management
  lib/
    api.ts                   # API client, type definitions, all API wrapper functions
    auth.ts                  # Token storage (localStorage)
```

Key patterns:
- All API calls go through `src/lib/api.ts` which provides typed wrapper functions (`authApi`, `workoutApi`, `exerciseApi`, `statsApi`, `menuApi`, `bodyWeightApi`)
- Server state managed with TanStack Query (React Query)
- API base URL configured via `NEXT_PUBLIC_API_URL` env var (defaults to `http://localhost:8081`)

### API Endpoints (all under `/api/v1/`)

- `auth/` - register, login, me
- `exercises/` - preset list, custom CRUD, progress per exercise
- `workouts/` - CRUD, list with pagination, by-date lookup, monthly calendar
- `stats/` - muscle group stats, personal bests
- `menus/` - training menu CRUD with ordered exercise items
- `body-weights/` - daily weight/body-fat recording, date range queries

## Deployment

- **Frontend**: Cloudflare Pages (via `@cloudflare/next-on-pages`, `wrangler.toml`)
- **Backend**: GCP Cloud Run (GitHub Actions CI/CD in `.github/workflows/deploy-backend.yml`, triggers on push to `main` with changes in `backend/`)
- **Database**: External PostgreSQL (configured via `DATABASE_URL` env var in production)