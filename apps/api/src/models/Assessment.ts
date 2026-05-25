import mongoose, { Schema, Document } from "mongoose"
import type { GeneratedAssessment } from "../types/index"

export interface IAssessment extends Omit<GeneratedAssessment, "id">, Document {}

const MCQOptionSchema = new Schema({ label: String, text: String }, { _id: false })

const QuestionSchema = new Schema({
  id: String,
  number: Number,
  text: { type: String, required: true },
  type: String,
  difficulty: { type: String, enum: ["easy", "medium", "hard"] },
  marks: Number,
  options: [MCQOptionSchema],
  answer: String,        // Stored but never sent to frontend
}, { _id: false })

const SectionSchema = new Schema({
  name: String,
  questionType: String,
  instructions: String,
  totalMarks: Number,
  questions: [QuestionSchema],
}, { _id: false })

const AssessmentSchema = new Schema<IAssessment>({
  assignmentId: { type: String, required: true, index: true },
  title: String,
  subject: String,
  topic: String,
  gradeLevel: String,
  dueDate: String,
  totalMarks: Number,
  duration: String,
  generalInstructions: [String],
  sections: [SectionSchema],
  status: { type: String, enum: ["pending", "generating", "complete", "failed"], default: "pending" },
  generatedAt: String,
}, { timestamps: true })

export const Assessment = mongoose.model<IAssessment>("Assessment", AssessmentSchema)
