# Deployment Guide (Free Tier)

The entire app code (Express API + WebSocket + BullMQ worker + Next.js frontend) runs in a **single Docker container** — the `Dockerfile` and `docker-entrypoint.sh` in this repo handle both processes. The only external dependencies are **MongoDB** and **Redis**, provisioned via free managed tiers.

```
┌──────────────────────────────────────────────────────────────┐
│                Single Docker Container                        │
│                                                              │
│  ┌─────────────────────┐   ┌──────────────────────────────┐  │
│  │  Express API         │   │  Next.js Frontend            │  │
│  │  :8000               │   │  :3000                       │  │
│  │  REST + WebSocket    │   │  UI served to browser        │  │
│  │  + BullMQ Worker     │   │                              │  │
│  └────────┬────────────┘   └──────────────────────────────┘  │
│           │      docker-entrypoint.sh runs both               │
│           ▼                                                    │
│    ┌──────────────────────────────────────────────────┐       │
│    │  Single process per container (background bg)    │       │
│    └──────────────────────────────────────────────────┘       │
└───────────────────────┬──────────────────────────────────────┘
                        │
            ┌───────────┴───────────┐
            ▼                       ▼
    MongoDB Atlas (Free)    Redis Cloud (Free 30MB)
```

---

## 1. MongoDB Atlas — Free Database

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and sign up.
2. Create a **free M0 cluster** (512 MB, shared RAM).
3. **Network Access** → "Add IP Address" → `0.0.0.0/0` (allow all).
4. **Database Access** → Create a user with password.
5. **Connect** → "Connect your application" → copy the URI:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/vedaai?retryWrites=true&w=majority
   ```

---

## 2. Redis Cloud — Free Cache/Queue

1. Go to [redis.com/try-free](https://redis.com/try-free) and sign up.
2. Create a **free 30 MB** subscription.
3. Copy the **Public endpoint**:
   ```
   redis://default:password@redis-xxxxx.cXXXXX.ap-southeast-1-1.ec2.cloud.redislabs.com:12345
   ```

---

## 3. Build & Push the Docker Image

```bash
# Build the single container
docker build -t vedaai .

# Tag and push to a registry (Docker Hub / GitHub Container Registry)
docker tag vedaai ghcr.io/your-org/vedaai:latest
docker push ghcr.io/your-org/vedaai:latest
```

---

## 4. Deploy the Container

| Platform    | Free tier            | WebSockets | Always-on                 |
| ----------- | -------------------- | ---------- | ------------------------- |
| **Railway** | $5/mo credit         | ✅         | ✅                        |
| **Fly.io**  | $3/mo credit (3 VMs) | ✅         | ✅                        |
| **Render**  | Free                 | ✅         | ❌ (spins down after 15m) |

### Option A: Railway (Recommended)

1. Push your repo to GitHub.
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
3. Railway auto-detects the `Dockerfile`.
4. In the **Variables** tab, add:

```
PORT=8000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/vedaai
REDIS_URL=redis://default:password@redis-xxxxx.cXXXXX.ap-southeast-1-1.ec2.cloud.redislabs.com:12345
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=google/gemini-2.5-flash:free
FRONTEND_URL=https://your-app.up.railway.app
NEXT_PUBLIC_API_URL=https://your-app.up.railway.app
NEXT_PUBLIC_WS_URL=wss://your-app.up.railway.app
```

5. Railway exposes port `8000` automatically. Your API + frontend are at `https://your-app.up.railway.app`.

> **Single-port access**: The entrypoint runs Next.js on `:3000` and Express on `:8000`. Railway exposes `:8000` publicly. The frontend's env vars point to the same Railway domain on `:8000`, so everything goes through that one port/domain.

### Option B: Fly.io

```bash
# Install flyctl
flyctl auth login

# Launch
flyctl launch --image ghcr.io/your-org/vedaai:latest
```

Create `fly.toml`:

```toml
app = "vedaai"

[env]
  PORT = "8000"
  MONGODB_URI = "mongodb+srv://..."
  REDIS_URL = "redis://..."
  OPENROUTER_API_KEY = "sk-or-v1-..."
  OPENROUTER_MODEL = "google/gemini-2.5-flash:free"
  FRONTEND_URL = "https://vedaai.fly.dev"
  NEXT_PUBLIC_API_URL = "https://vedaai.fly.dev"
  NEXT_PUBLIC_WS_URL = "wss://vedaai.fly.dev"

[[services]]
  internal_port = 8000
  protocol = "tcp"
  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]
  [[services.ports]]
    port = 80
    handlers = ["http"]
```

```bash
flyctl deploy
```

### Option C: Render (Simplest, Spins Down on Idle)

1. Go to [render.com](https://render.com) → **New Web Service**.
2. Connect your GitHub repo.
3. **Environment**: `Docker`
4. **Plan**: Free
5. Add the same environment variables as Railway (above).
6. **Health Check Path**: `/health`

> **Caveat**: Render's free tier spins down after 15 minutes of inactivity. First request after idle takes ~30s. BullMQ jobs won't process while the service is asleep.

---

## 5. Verify the Deployment

```bash
# Health check
curl https://your-app.up.railway.app/health
# → {"status":"ok"}

# Browse the frontend
open https://your-app.up.railway.app
```

Create an assignment — the frontend loads from Next.js (`:3000`), which calls the API (`:8000`) and connects via WebSocket. Both run in the same container.

---

## Important Notes

| Concern                          | Mitigation                                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Two processes, one container** | `docker-entrypoint.sh` runs Next.js in background, Express in foreground. Container stays alive as long as Express runs. |
| **CORS**                         | `FRONTEND_URL` env var controls the CORS origin. Set it to your Railway/Fly/Render domain.                               |
| **WebSocket support**            | Railway and Fly.io support WebSocket natively. No extra config.                                                          |
| **BullMQ worker**                | Runs in the same Node process as Express — no separate worker container needed.                                          |
| **No API key?**                  | Leave `OPENROUTER_API_KEY` empty — the app falls back to a built-in mock question generator.                             |
| **File uploads**                 | 10 MB limit (multer config + platform body limits).                                                                      |
| **MongoDB Atlas free**           | 512 MB / 100 connections — sufficient for light usage.                                                                   |
| **Redis Cloud free**             | 30 MB — enough for BullMQ queues + assessment caching under low load.                                                    |
