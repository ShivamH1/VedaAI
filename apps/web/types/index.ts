export type QuestionType = "mcq" | "short_answer" | "long_answer" | "true_false" | "fill_blank"
export type Difficulty = "easy" | "medium" | "hard"
export type DifficultyMix = { easy: number; medium: number; hard: number }

export interface SectionConfig {
  name: string
  questionType: QuestionType
  questionCount: number
  marksPerQuestion: number
  instructions: string
  difficultyMix: DifficultyMix
}

export interface AssignmentInput {
  title: string
  subject: string
  topic: string
  gradeLevel: string
  dueDate: string
  totalMarks: number
  sections: SectionConfig[]
  additionalInstructions: string
  uploadedFileText?: string
}

export interface MCQOption {
  label: string
  text: string
}

export interface Question {
  id: string
  number: number
  text: string
  type: QuestionType
  difficulty: Difficulty
  marks: number
  options?: MCQOption[]
  answer?: string
}

export interface AssessmentSection {
  name: string
  questionType: QuestionType
  instructions: string
  totalMarks: number
  questions: Question[]
}

export interface GeneratedAssessment {
  id: string
  assignmentId: string
  title: string
  subject: string
  topic: string
  gradeLevel: string
  dueDate: string
  totalMarks: number
  duration?: string
  generalInstructions: string[]
  sections: AssessmentSection[]
  generatedAt: string
  status: "pending" | "generating" | "complete" | "failed"
}

export interface Assignment {
  id: string; // mapped from _id for compatibility
  _id?: string;
  title: string;
  subject: string;
  topic: string;
  gradeLevel: string;
  dueDate: string;
  assignedDate?: string;
  createdAt?: string;
  updatedAt?: string;
  totalMarks: number;
  sections: SectionConfig[];
  additionalInstructions: string;
  status: "pending" | "generating" | "complete" | "failed";
  assessmentId?: string;
  jobId?: string;
}

export type WSMessageType =
  | "job_queued"
  | "generation_started"
  | "section_complete"
  | "generation_complete"
  | "generation_failed"

export interface WSMessage {
  type: WSMessageType
  assignmentId: string
  assessmentId?: string
  progress?: number
  message?: string
  sectionName?: string
}
