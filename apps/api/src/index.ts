import express from "express"
import cors from "cors"
import { createServer } from "http"
import { createProxyMiddleware } from "http-proxy-middleware"
import { connectDB } from "./lib/db"
import { wsService } from "./services/websocket.service"
import { assignmentsRouter } from "./routes/assignments"
import { assessmentsRouter } from "./routes/assessments"
import { generationWorker } from "./workers/generation.worker"
import { env } from "./lib/env"

const app = express()
const server = createServer(app)

// Enable CORS for frontend requests
app.use(cors({ origin: env.FRONTEND_URL }))

// Proxy Next.js frontend (running on port 3000)
const nextProxy = createProxyMiddleware({
  target: "http://localhost:3000",
  changeOrigin: true,
  ws: false, // Next.js in production doesn't require WebSocket proxying
})

// Check if request should be proxied to Next.js or handled by API
app.use((req, res, next) => {
  if (
    req.path.startsWith("/api") ||
    req.path.startsWith("/ws") ||
    req.path === "/health"
  ) {
    return next()
  }
  nextProxy(req, res, next)
})

// Scope body parsing exclusively to API routes so as not to break proxied POST requests
app.use("/api", express.json({ limit: "10mb" }))

app.use("/api/assignments", assignmentsRouter)
app.use("/api/assessments", assessmentsRouter)

app.get("/health", (_, res) => {
  res.json({ status: "ok" })
})

async function start() {
  await connectDB()
  
  // Bind WebSocket server to the HTTP server instance
  wsService.initialize(server)

  server.listen(env.PORT, () => {
    console.log(`API running on http://localhost:${env.PORT}`)
    console.log(`WebSocket running on ws://localhost:${env.PORT}/ws`)
    
    // Ensure generationWorker is instantiated
    console.log(`Worker active: ${generationWorker.isRunning() ? "yes" : "no"}`)
  })
}

start()
