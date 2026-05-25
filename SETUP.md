# Setup Guide

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| **Bun** | >= 1.3.4 | Package manager and runtime |
| **Node.js** | >= 18 | Runtime for some tools |
| **Docker Desktop** | Latest | MongoDB + Redis containers |
| **Git** | Any | Version control |

### Installing Bun

```powershell
# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"

# macOS / Linux
curl -fsSL https://bun.sh/install | bash
```

Verify: `bun --version` should show `1.3.4` or later.

---

## Step 1 — Clone and Install

```bash
cd D:\Projects\VedaAI
bun install
```

This installs all workspace dependencies (`apps/*`, `packages/*`) via Bun's workspace resolution.

---

## Step 2 — Start Infrastructure

MongoDB 7.0 and Redis 7.0 are required. The project provides a `docker-compose.yml`:

```bash
docker-compose up -d
```

This starts:
- **MongoDB** on `localhost:27017`
- **Redis** on `localhost:6379`

Both persist data in Docker volumes (`mongodb_data`, `redis_data`).

To stop: `docker-compose down`

---

## Step 3 — Configure Environment

The `.env.example` at the project root serves as a template for both apps.

### Backend (`apps/api/.env`)

```bash
cp .env.example apps/api/.env
```

Required values:
| Variable | Description | Example |
|---|---|---|
| `PORT` | API server port | `8000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/vedaai` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `OPENROUTER_API_KEY` | AI API key (optional — see note) | `sk-or-v1-...` |
| `OPENROUTER_MODEL` | AI model identifier | `openrouter/free` |
| `FRONTEND_URL` | CORS origin | `http://localhost:3000` |

**No API key?** The app automatically falls back to a **mock generator** that produces topic-aware placeholder questions. No AI credits required for development.

### Frontend (`apps/web/.env.local`)

```bash
cp .env.example apps/web/.env.local
```

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend REST URL |
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:8000` | Backend WebSocket URL |

The defaults work out of the box when running locally.

---

## Step 4 — Run in Development

Start both the API and frontend concurrently:

```bash
bun run dev
```

This runs `turbo run dev`, which starts:
- **API** — `http://localhost:8000` (using `tsx watch` for hot reload)
- **Web** — `http://localhost:3000` (Next.js dev server)

Verify the API is healthy:

```bash
curl http://localhost:8000/health
# → {"status":"ok"}
```

### Running a Single App

```bash
# API only
cd apps/api && bun run dev

# Frontend only
cd apps/web && bun run dev
```

---

## Step 5 — Build for Production

```bash
bun run build
```

This runs `turbo run build`, which compiles:
- **API** — TypeScript via `tsc` → output in `apps/api/dist/`
- **Web** — Next.js production build → output in `apps/web/.next/`
- **Packages** — Shared packages built first (depends on `^build` in turbo.json)

### Start Production Servers

```bash
# API
cd apps/api && bun run start

# Frontend
cd apps/web && bun run start
```

---

## Useful Commands

| Command | Description |
|---|---|
| `bun run dev` | Start all apps in dev mode |
| `bun run build` | Build all apps and packages |
| `bun run lint` | Lint all projects |
| `bun run format` | Format code with Prettier |
| `bun run check-types` | Type-check all projects |
| `bun add <pkg>` | Add dependency to root |
| `bun add <pkg> --cwd apps/api` | Add dependency to specific app |
| `docker-compose up -d` | Start MongoDB + Redis |
| `docker-compose down` | Stop MongoDB + Redis |

---

## Troubleshooting

### MongoDB connection refused
Ensure Docker Desktop is running and containers are up:
```bash
docker-compose ps
```

### Port conflicts
Change ports in `apps/api/.env` (`PORT`) and `apps/web/.env.local` (update both `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL`).

### Bun install fails
Delete `bun.lock` and `node_modules` in the root, then retry:
```bash
rm -rf node_modules bun.lock apps/*/node_modules packages/*/node_modules
bun install
```

### WebSocket not connecting
Make sure `NEXT_PUBLIC_WS_URL` in `apps/web/.env.local` matches the API server address (default: `ws://localhost:8000`).
