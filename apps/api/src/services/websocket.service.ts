import { WebSocketServer, WebSocket } from "ws"
import type { Server } from "http"
import type { WSMessage } from "../types/index"
import { Assignment } from "../models/Assignment"

class WebSocketService {
  private wss: WebSocketServer | null = null

  // Map: assignmentId → Set of connected WebSocket clients
  private rooms = new Map<string, Set<WebSocket>>()

  initialize(server: Server): void {
    this.wss = new WebSocketServer({ server, path: "/ws" })

    this.wss.on("connection", async (ws, req) => {
      // Client connects with ?assignmentId=xxx
      const url = new URL(req.url!, `http://localhost`)
      const assignmentId = url.searchParams.get("assignmentId")

      if (!assignmentId) {
        ws.close(4000, "assignmentId query param required")
        return
      }

      // Add to room
      if (!this.rooms.has(assignmentId)) {
        this.rooms.set(assignmentId, new Set())
      }
      this.rooms.get(assignmentId)!.add(ws)

      console.log(`[WS] Client connected to room: ${assignmentId}`)

      // Query database for current state to prevent race conditions
      try {
        const assignment = await Assignment.findById(assignmentId)
        if (assignment) {
          if (assignment.status === "complete" && assignment.assessmentId) {
            ws.send(JSON.stringify({
              type: "generation_complete",
              assignmentId,
              assessmentId: assignment.assessmentId,
              progress: 100,
              message: "Question paper generated successfully!",
            }))
          } else if (assignment.status === "failed") {
            ws.send(JSON.stringify({
              type: "generation_failed",
              assignmentId,
              message: "Generation failed. Please try again.",
            }))
          } else if (assignment.status === "generating") {
            ws.send(JSON.stringify({
              type: "generation_started",
              assignmentId,
              progress: 50,
              message: "AI is generating your question paper...",
            }))
          } else {
            ws.send(JSON.stringify({
              type: "job_queued",
              assignmentId,
              progress: 0,
              message: "Connected. Waiting for job to start...",
            }))
          }
        } else {
          ws.send(JSON.stringify({
            type: "job_queued",
            assignmentId,
            progress: 0,
            message: "Connected. Waiting for job to start...",
          }))
        }
      } catch (err: any) {
        console.error(`[WS] Error checking assignment status:`, err.message)
        ws.send(JSON.stringify({
          type: "job_queued",
          assignmentId,
          progress: 0,
          message: "Connected. Waiting for job to start...",
        }))
      }

      ws.on("close", () => {
        this.rooms.get(assignmentId)?.delete(ws)
        if (this.rooms.get(assignmentId)?.size === 0) {
          this.rooms.delete(assignmentId)
        }
      })

      ws.on("error", (err) => {
        console.error(`[WS] Error for room ${assignmentId}:`, err.message)
      })
    })
  }

  broadcast(assignmentId: string, message: WSMessage): void {
    const room = this.rooms.get(assignmentId)
    if (!room) return

    const payload = JSON.stringify(message)
    for (const client of room) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload)
      }
    }
  }
}

export const wsService = new WebSocketService()
