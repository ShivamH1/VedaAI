import { create } from "zustand";
import { Assignment } from "../types";
import { api } from "../lib/api";

interface AssignmentStore {
  assignments: Assignment[];
  isLoading: boolean;
  error: string | null;
  fetchAssignments: () => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
}

export const useAssignmentStore = create<AssignmentStore>((set, get) => ({
  assignments: [],
  isLoading: false,
  error: null,

  fetchAssignments: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.getAssignments();
      set({ assignments: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || "Failed to load assignments", isLoading: false });
    }
  },

  deleteAssignment: async (id: string) => {
    // Optimistic update
    const previousAssignments = get().assignments;
    set({
      assignments: previousAssignments.filter((a) => a.id !== id),
    });

    try {
      await api.deleteAssignment(id);
    } catch (err: any) {
      // Rollback on failure
      set({
        assignments: previousAssignments,
        error: err.message || "Failed to delete assignment",
      });
    }
  },
}));
