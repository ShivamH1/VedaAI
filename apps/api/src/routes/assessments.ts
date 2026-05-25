import { Router } from "express"
import { Assessment } from "../models/Assessment"
import { generationQueue } from "../queues/generation.queue"
import { Assignment } from "../models/Assignment"
import { redis } from "../lib/redis"

const router = Router()

// GET /assessments/:id — Get generated assessment
router.get("/:id", async (req, res): Promise<any> => {
  const includeAnswers = req.query.includeAnswers === "true"
  const cacheKey = `assessment:${req.params.id}${includeAnswers ? ":answers" : ""}`

  try {
    const cachedData = await redis.get(cacheKey)
    if (cachedData) {
      console.log(`[Cache Hit] Assessment ${req.params.id} (answers: ${includeAnswers}) served from Redis`)
      return res.json(JSON.parse(cachedData))
    }
  } catch (cacheErr: any) {
    console.error(`[Cache Error] Failed reading cache:`, cacheErr.message)
  }

  try {
    const assessment = await Assessment.findById(req.params.id).lean()
    if (!assessment) return res.status(404).json({ error: "Not found" })

    // Conditional answer stripping
    let responsePayload: any
    if (includeAnswers) {
      responsePayload = assessment
    } else {
      responsePayload = {
        ...assessment,
        sections: assessment.sections?.map(section => ({
          ...section,
          questions: section.questions?.map(q => {
            const { answer, ...rest } = q as any
            return rest
          })
        }))
      }
    }

    // Cache completed assessments for 1 hour
    if (assessment.status === "complete") {
      try {
        await redis.set(cacheKey, JSON.stringify(responsePayload), "EX", 3600)
        console.log(`[Cache Miss] Assessment ${req.params.id} (answers: ${includeAnswers}) saved to Redis`)
      } catch (cacheErr: any) {
        console.error(`[Cache Error] Failed writing cache:`, cacheErr.message)
      }
    }

    res.json(responsePayload)
  } catch (error) {
    res.status(500).json({ error: "Internal server error" })
  }
})

// POST /assessments/:id/regenerate — Queue regeneration
router.post("/:id/regenerate", async (req, res): Promise<any> => {
  try {
    const assessment = await Assessment.findById(req.params.id)
    if (!assessment) return res.status(404).json({ error: "Not found" })

    const assignment = await Assignment.findById(assessment.assignmentId)
    if (!assignment) return res.status(404).json({ error: "Assignment not found" })

    // Clear all Redis cache versions for this assessment
    await redis.del(`assessment:${req.params.id}`)
    await redis.del(`assessment:${req.params.id}:answers`)

    // Reset statuses
    await Assessment.findByIdAndUpdate(req.params.id, { status: "generating" })
    await Assignment.findByIdAndUpdate(assessment.assignmentId, { status: "generating" })

    // Re-queue
    await generationQueue.add("generate", {
      assignmentId: String(assignment._id),
      input: assignment.toObject(),
    })

    res.json({
      message: "Regeneration queued",
      assessmentId: req.params.id,
      assignmentId: String(assignment._id)
    })
  } catch (error) {
    res.status(500).json({ error: "Internal server error" })
  }
})

export { router as assessmentsRouter }
