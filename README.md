# VedaAI

**AI-Powered Assessment Creator** — Generate structured question papers from natural language descriptions. Teachers fill out a form (subject, topic, question types, optional reference file upload), and an AI model generates a complete, well-formatted question paper in real time.

---

## Architecture Overview

### System Layout

```
┌──────────────────────────────────────────────────────────┐
│                   Next.js 16 Frontend                     │
│  (apps/web)                                               │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │  Create   │  │  Generation  │  │  Assessment Result │  │
│  │  Page     │  │  Progress    │  │  Page              │  │
│  └────┬─────┘  └──────┬───────┘  └────────┬───────────┘  │
│       │               │                   │              │
│  ┌────▼───────────────▼───────────────────▼───────────┐  │
│  │              Zustand Stores                         │  │
│  │  (assignment.store.ts, generation.store.ts)         │  │
│  └───────────────────────┬────────────────────────────┘  │
│                          │                                │
│  ┌───────────────────────▼────────────────────────────┐  │
│  │              API Client (lib/api.ts)                │  │
│  │         REST (fetch)  +  WebSocket (native)         │  │
│  └──────┬──────────────────────────┬───────────────────┘  │
└─────────┼──────────────────────────┼──────────────────────┘
          │ REST (HTTP/JSON)         │ WS (real-time events)
          │ POST /api/assignments    │ ws://host/ws?assignmentId=xxx
          │ GET  /api/assessments/:id│
          ▼                          ▼
┌─────────────────────────────────────────────────────────┐
│              Express + BullMQ Backend                    │
│  (apps/api)                                              │
│                                                          │
│  ┌──────────┐   ┌───────────┐   ┌─────────────────────┐│
│  │  Routes   │──▶│  Queue    │──▶│  Worker (background)││
│  │          │   │  (BullMQ) │   │  (generation.worker)││
│  └──────────┘   └───────────┘   └─────────┬───────────┘│
│        │                                    │           │
│        ▼                                    ▼           │
│  ┌──────────┐   ┌───────────┐   ┌─────────────────────┐│
│  │ Mongoose  │   │  Redis    │   │  AI Service          ││
│  │ Models    │   │  Cache    │   │  (Gemini via OpenAI  ││
│  │(MongoDB)  │   │  + Queue  │   │   compat + Mock)    ││
│  └──────────┘   └───────────┘   └─────────────────────┘│
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  WebSocket Service (room-based broadcast)          │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Request Flow

1. **Teacher** fills the creation form in the Next.js frontend (subject, topic, sections with question types/counts/marks, optional PDF/image upload).
2. **Frontend** sends `POST /api/assignments` with `FormData` (multipart JSON + optional file).
3. **Express route** validates the payload with Zod, extracts text from any uploaded file (PDF via `pdf-parse`), saves an `Assignment` document to MongoDB, and enqueues a **BullMQ** job.
4. **BullMQ worker** picks up the job asynchronously:
   - Updates assignment status to `"generating"`
   - Creates a pending `Assessment` record in MongoDB
   - Broadcasts `generation_started` via WebSocket
   - Calls the **AI service** (Gemini API via OpenAI-compatible client, or built-in mock fallback)
   - Parses and validates the AI response (never renders raw LLM output — every field is typed and validated)
   - Pads missing questions if the LLM returns fewer than requested
   - Saves the completed assessment, updates assignment status to `"complete"`
   - Broadcasts `generation_complete` via WebSocket
5. **Frontend** receives WebSocket events in real time (Zustand store), shows a progress bar, then redirects to the result page.
6. **Result page** fetches the generated assessment via `GET /api/assessments/:id` (answers are **stripped** by default; `?includeAnswers=true` for full data).
7. Completed assessments are **Redis-cached** for 1 hour (two keys: with and without answers). Cache is invalidated on regeneration.

### Key Design Decisions

| Principle | Implementation |
|---|---|
| **No raw LLM output** | All AI responses go through `parseAndValidate()` — JSON parsing, field-level type checks, structural validation. Never rendered directly. |
| **Resilience over failure** | If the LLM returns fewer questions than requested, the system **pads** with placeholder questions rather than failing. |
| **Mock fallback** | If no API key is configured, `generateMockAssessment()` produces topic-aware mock questions. Enables development/demo without an AI API. |
| **Security-by-default** | Answer keys are stripped from API responses unless `?includeAnswers=true` is explicitly set. |
| **Background processing** | Assessment generation runs in a BullMQ worker — the HTTP response returns immediately with a `jobId`, and the frontend polls progress via WebSocket. |
| **Retry with backoff** | AI service implements 3 retry attempts with exponential backoff (2s, 4s) and longer delay for rate limits (5s, 10s). 90s request timeout. |
| **State recovery** | WebSocket connection replays current assignment state from the database on connect, preventing race conditions. |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Monorepo** | Turborepo + Bun workspaces |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS v4 |
| **State** | Zustand (client state) |
| **Backend** | Express + TypeScript (via tsx) |
| **Database** | MongoDB 7.0 + Mongoose |
| **Queue** | BullMQ + Redis 7 |
| **Cache** | Redis |
| **AI** | Gemini API (OpenAI-compatible endpoint) + mock fallback |
| **Real-time** | Native WebSocket (browser) + `ws` (server) |
| **Validation** | Zod |
| **File upload** | Multer (memory storage, 10MB limit) |
| **PDF parsing** | pdf-parse |

---

## Quick Start

```bash
# Prerequisites: Bun >= 1.3.4, Docker Desktop

# 1. Install dependencies
bun install

# 2. Start MongoDB + Redis
docker-compose up -d

# 3. Configure environment
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local
# Edit apps/api/.env with your OpenRouter/Gemini API key

# 4. Start development servers
bun run dev
# API: http://localhost:8000
# Web: http://localhost:3000
```

[Full setup instructions →](./SETUP.md)

---

## Project Structure

```
├── apps/
│   ├── api/                  # Express backend
│   │   └── src/
│   │       ├── index.ts               # Entry point
│   │       ├── lib/                   # DB, Redis, env
│   │       ├── models/                # Mongoose schemas
│   │       ├── queues/                # BullMQ queue
│   │       ├── routes/                # REST endpoints
│   │       ├── services/              # AI, PDF, WebSocket logic
│   │       ├── types/                 # Shared TS types
│   │       └── workers/               # BullMQ worker
│   └── web/                   # Next.js frontend
│       └── app/
│           ├── page.tsx               # Dashboard
│           ├── create/page.tsx        # Creation form
│           └── assessment/[id]/       # Progress + result pages
├── packages/
│   ├── ui/                    # Shared React components
│   ├── eslint-config/        # Shared ESLint configs
│   └── typescript-config/    # Shared TSConfigs
├── docker-compose.yml        # MongoDB + Redis
└── .env.example              # Environment template
```
