import dotenv from "dotenv"
import { z } from "zod"

// Load env files
dotenv.config()

const envSchema = z.object({
  PORT: z.coerce.number().default(8000),
  MONGODB_URI: z.string().default("mongodb://localhost:27017/vedaai"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  OPENROUTER_API_KEY: z.string().default("sk-or-your-key"),
  OPENROUTER_MODEL: z.string().default("google/gemini-2.5-flash:free"),
  FRONTEND_URL: z.string().default("http://localhost:3000").transform(s => s.replace(/\/+$/, "")),
})

export const env = envSchema.parse(process.env)
