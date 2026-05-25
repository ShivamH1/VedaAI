import mongoose, { Schema, Document } from "mongoose"
import type { AssignmentInput } from "../types/index"

export interface IAssignment extends AssignmentInput, Document {
  status: "pending" | "generating" | "complete" | "failed"
  assessmentId?: string
  jobId?: string
  createdAt: Date
  updatedAt: Date
}

const SectionConfigSchema = new Schema({
  name: { type: String, required: true },
  questionType: {
    type: String,
    required: true,
    enum: ["mcq", "short_answer", "long_answer", "true_false", "fill_blank"]
  },
  questionCount: { type: Number, required: true, min: 1 },
  marksPerQuestion: { type: Number, required: true, min: 1 },
  instructions: { type: String, default: "Attempt all questions" },
  difficultyMix: {
    easy: { type: Number, default: 33 },
    medium: { type: Number, default: 34 },
    hard: { type: Number, default: 33 },
  }
}, { _id: false })

const AssignmentSchema = new Schema<IAssignment>({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  topic: { type: String, required: true },
  gradeLevel: { type: String, required: true },
  dueDate: { type: String, required: true },
  totalMarks: { type: Number, required: true },
  sections: [SectionConfigSchema],
  additionalInstructions: { type: String, default: "" },
  uploadedFileText: { type: String },
  status: { type: String, enum: ["pending", "generating", "complete", "failed"], default: "pending" },
  assessmentId: { type: String },
  jobId: { type: String },
}, { timestamps: true })

export const Assignment = mongoose.model<IAssignment>("Assignment", AssignmentSchema)
