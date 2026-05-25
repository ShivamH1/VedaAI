import { Assignment, AssignmentInput, GeneratedAssessment } from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function formatDate(dateStr?: string): string {
  if (!dateStr) return "-";
  // If already DD-MM-YYYY, return as-is
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

// Helper to map Mongoose _id to client-facing id
function mapAssignment(data: any): Assignment {
  return {
    ...data,
    id: data._id || data.id,
    assignedDate: data.assignedDate || formatDate(data.createdAt),
    dueDate: formatDate(data.dueDate),
  };
}

export const api = {
  /**
   * Fetch all assignments
   */
  async getAssignments(): Promise<Assignment[]> {
    const res = await fetch(`${API_URL}/api/assignments`);
    if (!res.ok) {
      throw new Error(`Failed to fetch assignments: ${res.statusText}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data.map(mapAssignment) : [];
  },

  /**
   * Fetch a single assignment by ID
   */
  async getAssignment(id: string): Promise<Assignment> {
    const res = await fetch(`${API_URL}/api/assignments/${id}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch assignment ${id}: ${res.statusText}`);
    }
    const data = await res.json();
    return mapAssignment(data);
  },

  /**
   * Create an assignment, optionally uploading a PDF/TXT reference file
   */
  async createAssignment(
    input: Omit<AssignmentInput, "totalMarks">,
    file?: File
  ): Promise<{ assignmentId: string; jobId: string; status: string; message: string }> {
    const formData = new FormData();
    // We send the JSON data stringified under the 'data' field as expected by multer in the backend
    formData.append("data", JSON.stringify(input));
    
    if (file) {
      formData.append("file", file);
    }

    const res = await fetch(`${API_URL}/api/assignments`, {
      method: "POST",
      body: formData, // fetch sets content-type multipart/form-data automatically with correct boundary
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || "Failed to create assignment");
    }

    return res.json();
  },

  /**
   * Delete an assignment by ID
   */
  async deleteAssignment(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_URL}/api/assignments/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error(`Failed to delete assignment ${id}: ${res.statusText}`);
    }

    return res.json();
  },

  /**
   * Fetch generated assessment
   */
  async getAssessment(id: string, includeAnswers = false): Promise<GeneratedAssessment> {
    const res = await fetch(`${API_URL}/api/assessments/${id}?includeAnswers=${includeAnswers}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch assessment ${id}: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Regenerate assessment
   */
  async regenerateAssessment(id: string): Promise<{
    message: string;
    assessmentId: string;
    assignmentId: string;
  }> {
    const res = await fetch(`${API_URL}/api/assessments/${id}/regenerate`, {
      method: "POST",
    });

    if (!res.ok) {
      throw new Error(`Failed to regenerate assessment ${id}: ${res.statusText}`);
    }

    return res.json();
  },
};
