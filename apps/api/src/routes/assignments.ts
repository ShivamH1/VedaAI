import { Router, Request, Response } from "express"
import multer from "multer"
import { z } from "zod"
import { Assignment } from "../models/Assignment"
import { Assessment } from "../models/Assessment"
import { redis } from "../lib/redis"
import { generationQueue } from "../queues/generation.queue"
import { pdfService } from "../services/pdf.service"

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

// Validation schema
const SectionConfigSchema = z.object({
  name: z.string().min(1),
  questionType: z.enum(["mcq", "short_answer", "long_answer", "true_false", "fill_blank"]),
  questionCount: z.number().int().min(1).max(50),
  marksPerQuestion: z.number().min(1),
  instructions: z.string().default("Attempt all questions"),
  difficultyMix: z.object({
    easy: z.number().min(0).max(100),
    medium: z.number().min(0).max(100),
    hard: z.number().min(0).max(100),
  }).refine(mix => mix.easy + mix.medium + mix.hard === 100, {
    message: "Difficulty percentages must sum to 100"
  })
})

const CreateAssignmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subject: z.string().min(1, "Subject is required"),
  topic: z.string().min(1, "Topic is required"),
  gradeLevel: z.string().min(1, "Grade level is required"),
  dueDate: z.string().refine(d => !isNaN(Date.parse(d)), "Invalid date"),
  sections: z.array(SectionConfigSchema).min(1, "At least one section required"),
  additionalInstructions: z.string().optional().default(""),
})

// POST /assignments — Create assignment + queue generation job
router.post("/", upload.single("file"), async (req: Request, res: Response): Promise<any> => {
  try {
    const body = JSON.parse(req.body.data || JSON.stringify(req.body))
    const validated = CreateAssignmentSchema.parse(body)

    // Extract text from uploaded file if present
    let uploadedFileText: string | undefined
    if (req.file) {
      if (req.file.mimetype === "application/pdf") {
        uploadedFileText = await pdfService.extractText(req.file.buffer)
      } else {
        uploadedFileText = req.file.buffer.toString("utf-8")
      }
    }

    // Compute total marks
    const totalMarks = validated.sections.reduce(
      (sum, s) => sum + s.questionCount * s.marksPerQuestion, 0
    )

    // Create assignment in DB
    const assignment = await Assignment.create({
      ...validated,
      totalMarks,
      uploadedFileText,
      status: "pending",
    })

    // Queue generation job
    const job = await generationQueue.add("generate", {
      assignmentId: String(assignment._id),
      input: { ...validated, totalMarks, uploadedFileText },
    })

    await Assignment.findByIdAndUpdate(assignment._id, { jobId: job.id })

    res.status(201).json({
      assignmentId: String(assignment._id),
      jobId: job.id,
      status: "pending",
      message: "Assignment created. Generation job queued.",
    })
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: err.errors })
    }
    console.error(err)
    res.status(500).json({ error: "Internal server error" })
  }
})

// GET /assignments — List all assignments
router.get("/", async (req, res): Promise<any> => {
  try {
    const assignments = await Assignment.find().sort({ createdAt: -1 })
    res.json(assignments)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// GET /assignments/:id — Get assignment + status
router.get("/:id", async (req, res): Promise<any> => {
  try {
    const assignment = await Assignment.findById(req.params.id)
    if (!assignment) return res.status(404).json({ error: "Not found" })
    res.json(assignment)
  } catch (error) {
    res.status(500).json({ error: "Internal server error" })
  }
})

// DELETE /assignments/:id — Delete assignment and its associated assessment
router.delete("/:id", async (req, res): Promise<any> => {
  try {
    const assignment = await Assignment.findById(req.params.id)
    if (!assignment) return res.status(404).json({ error: "Not found" })

    // Delete associated assessment if exists
    if (assignment.assessmentId) {
      await Assessment.findByIdAndDelete(assignment.assessmentId)
      // also clear redis cache
      await redis.del(`assessment:${assignment.assessmentId}`)
      await redis.del(`assessment:${assignment.assessmentId}:answers`)
    }

    // Delete any other assessments linked to this assignment
    await Assessment.deleteMany({ assignmentId: req.params.id })

    await Assignment.findByIdAndDelete(req.params.id)

    res.json({ message: "Assignment and associated assessments deleted successfully" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Internal server error" })
  }
})

export { router as assignmentsRouter }
