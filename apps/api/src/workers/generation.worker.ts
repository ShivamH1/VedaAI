import { Worker, Job } from "bullmq"
import { redis } from "../lib/redis"
import { Assignment } from "../models/Assignment"
import { Assessment } from "../models/Assessment"
import { generateAssessment } from "../services/ai.service"
import { wsService } from "../services/websocket.service"
import type { GenerationJobData } from "../queues/generation.queue"

export const generationWorker = new Worker<GenerationJobData>(
  "assessment-generation",
  async (job: Job<GenerationJobData>) => {
    const { assignmentId, input } = job.data

    // 1. Mark assignment as generating
    await Assignment.findByIdAndUpdate(assignmentId, { status: "generating" })

    // Create a pending assessment record
    const assessment = await Assessment.create({
      assignmentId,
      status: "generating",
      title: input.title,
      subject: input.subject,
      topic: input.topic,
      gradeLevel: input.gradeLevel,
      dueDate: input.dueDate,
      totalMarks: input.totalMarks,
    })

    wsService.broadcast(assignmentId, {
      type: "generation_started",
      assignmentId,
      assessmentId: String(assessment._id),
      progress: 10,
      message: "AI is generating your question paper...",
    })

    await job.updateProgress(10)

    try {
      // 2. Parse uploaded PDF if present
      let fileText: string | undefined
      if (input.uploadedFileText) {
        wsService.broadcast(assignmentId, {
          type: "generation_started",
          assignmentId,
          progress: 20,
          message: "Processing uploaded content...",
        })
        fileText = input.uploadedFileText
        await job.updateProgress(20)
      }

      // 3. Generate via AI
      const generated = await generateAssessment(
        { ...input, uploadedFileText: fileText },
        (message) => {
          wsService.broadcast(assignmentId, {
            type: "generation_started",
            assignmentId,
            progress: 50,
            message,
          })
        }
      )

      await job.updateProgress(80)

      // 4. Simulate per-section progress events
      for (let i = 0; i < generated.sections.length; i++) {
        wsService.broadcast(assignmentId, {
          type: "section_complete",
          assignmentId,
          sectionName: generated.sections[i].name,
          progress: 80 + Math.round(((i + 1) / generated.sections.length) * 15),
          message: `${generated.sections[i].name} complete`,
        })
      }

      // 5. Save completed assessment
      const updated = await Assessment.findByIdAndUpdate(
        assessment._id,
        {
          ...generated,
          assignmentId,
          status: "complete",
          generatedAt: new Date().toISOString(),
        },
        { new: true }
      )

      // 6. Update assignment status
      await Assignment.findByIdAndUpdate(assignmentId, {
        status: "complete",
        assessmentId: String(assessment._id),
      })

      await job.updateProgress(100)

      // 7. Notify frontend — done
      wsService.broadcast(assignmentId, {
        type: "generation_complete",
        assignmentId,
        assessmentId: String(assessment._id),
        progress: 100,
        message: "Question paper generated successfully!",
      })

    } catch (err: any) {
      // Mark as failed
      await Assessment.findByIdAndUpdate(assessment._id, { status: "failed" })
      await Assignment.findByIdAndUpdate(assignmentId, { status: "failed" })

      wsService.broadcast(assignmentId, {
        type: "generation_failed",
        assignmentId,
        message: err.message || "Generation failed. Please try again.",
      })

      throw err  // Let BullMQ handle retry
    }
  },
  {
    connection: redis,
    concurrency: 3,  // Process up to 3 jobs simultaneously
  }
)

generationWorker.on("completed", (job) => {
  console.log(`[Worker] Job ${job.id} completed`)
})

generationWorker.on("failed", (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err.message)
})
