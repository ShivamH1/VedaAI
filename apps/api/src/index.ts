import express from "express"
import cors from "cors"
import { createServer } from "http"
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
app.use(express.json({ limit: "10mb" }))

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
