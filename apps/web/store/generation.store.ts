import { create } from "zustand";
import { WSMessage, WSMessageType } from "../types";

interface GenerationState {
  progress: number;
  statusMessage: string;
  currentType: WSMessageType | null;
  assessmentId: string | null;
  assignmentId: string | null;
  error: string | null;
  isConnected: boolean;
  connect: (assignmentId: string) => void;
  disconnect: () => void;
  reset: () => void;
}

let ws: WebSocket | null = null;

export const useGenerationStore = create<GenerationState>((set, get) => ({
  progress: 0,
  statusMessage: "Initializing connection...",
  currentType: null,
  assessmentId: null,
  assignmentId: null,
  error: null,
  isConnected: false,

  connect: (assignmentId: string) => {
    // If already connected or connecting to the same assignment, do nothing
    if (get().isConnected && get().assignmentId === assignmentId) {
      return;
    }

    // Clean up previous socket if any
    if (ws) {
      ws.close();
    }

    const wsUrlBase = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
    const url = `${wsUrlBase}/ws?assignmentId=${assignmentId}`;

    set({
      assignmentId,
      isConnected: false,
      error: null,
      progress: 0,
      statusMessage: "Connecting to server...",
      currentType: null,
      assessmentId: null,
    });

    try {
      ws = new WebSocket(url);

      ws.onopen = () => {
        set({ isConnected: true, error: null });
        console.log(`[WS Connected] for assignment ${assignmentId}`);
      };

      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          
          if (message.assignmentId !== assignmentId) return;

          set({
            progress: typeof message.progress === "number" ? message.progress : get().progress,
            statusMessage: message.message || get().statusMessage,
            currentType: message.type,
            assessmentId: message.assessmentId || get().assessmentId,
          });

          if (message.type === "generation_failed") {
            set({ error: message.message || "Generation failed" });
          }
        } catch (err) {
          console.error("Failed to parse WS message:", err);
        }
      };

      ws.onclose = (event) => {
        set({ isConnected: false });
        console.log(`[WS Closed] Code: ${event.code}, Reason: ${event.reason}`);
      };

      ws.onerror = (err) => {
        set({ error: "Connection error occurred", isConnected: false });
        console.error("[WS Error]", err);
      };
    } catch (err: any) {
      set({ error: err.message || "Failed to create connection", isConnected: false });
    }
  },

  disconnect: () => {
    if (ws) {
      ws.close();
      ws = null;
    }
    set({ isConnected: false });
  },

  reset: () => {
    if (ws) {
      ws.close();
      ws = null;
    }
    set({
      progress: 0,
      statusMessage: "Initializing connection...",
      currentType: null,
      assessmentId: null,
      assignmentId: null,
      error: null,
      isConnected: false,
    });
  },
}));
