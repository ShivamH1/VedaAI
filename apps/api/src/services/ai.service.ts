import OpenAI from "openai";
import { env } from "../lib/env";
import type {
  AssignmentInput,
  GeneratedAssessment,
  AssessmentSection,
  Question,
  QuestionType,
  Difficulty,
} from "../types/index";

// Initialize OpenAI client pointing to Gemini OpenAI-compatibility endpoint
const client = new OpenAI({
  apiKey: env.OPENROUTER_API_KEY || "dummy",
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "VedaAI Assessment Creator",
  },
});

// Check if we are running in mock fallback mode
function isMockMode(): boolean {
  return (
    !env.OPENROUTER_API_KEY ||
    env.OPENROUTER_API_KEY === "sk-or-your-key" ||
    env.OPENROUTER_API_KEY.trim() === ""
  );
}

// ─── Prompt Builder ──────────────────────────────────────────────────────────

function buildPrompt(input: AssignmentInput): string {
  const sectionDescriptions = input.sections
    .map(
      (s) => `
  - Section ${s.name}: ${s.questionCount} ${s.questionType.replace("_", " ")} questions,
    ${s.marksPerQuestion} marks each,
    Difficulty mix: ${s.difficultyMix.easy}% easy, ${s.difficultyMix.medium}% medium, ${s.difficultyMix.hard}% hard.
    Instructions: "${s.instructions}"`,
    )
    .join("\n");

  const contextBlock = input.uploadedFileText
    ? `\n\nReference material provided by the teacher:\n<context>\n${input.uploadedFileText.slice(0, 3000)}\n</context>\nBase questions on this material where relevant.`
    : "";

  return `You are an expert educator creating a formal examination paper.

ASSIGNMENT DETAILS:
- Title: ${input.title}
- Subject: ${input.subject}
- Topic: ${input.topic}
- Grade Level: ${input.gradeLevel}
- Due Date: ${input.dueDate}
- Total Marks: ${input.totalMarks}
- Additional Instructions: ${input.additionalInstructions || "None"}
${contextBlock}

SECTIONS TO GENERATE:
${sectionDescriptions}

STRICT RULES:
1. Generate EXACTLY the number of questions specified per section.
2. Respect the difficulty mix percentages. Round to nearest whole number.
3. For MCQ: always provide exactly 4 options labeled A, B, C, D. Include a correct "answer" field.
4. Questions must be appropriate for the specified grade level and topic.
5. Do NOT repeat questions.
6. Make questions clear, unambiguous, and academically rigorous.

OUTPUT FORMAT:
Return ONLY a valid JSON object. No markdown, no explanation, no text outside the JSON.

{
  "title": "string",
  "subject": "string",
  "topic": "string",
  "gradeLevel": "string",
  "dueDate": "string",
  "totalMarks": number,
  "duration": "string (e.g. '2 hours 30 minutes')",
  "generalInstructions": ["string", "string"],
  "sections": [
    {
      "name": "Section A",
      "questionType": "mcq",
      "instructions": "string",
      "totalMarks": number,
      "questions": [
        {
          "id": "A1",
          "number": 1,
          "text": "string",
          "type": "mcq",
          "difficulty": "easy",
          "marks": number,
          "options": [
            { "label": "A", "text": "string" },
            { "label": "B", "text": "string" },
            { "label": "C", "text": "string" },
            { "label": "D", "text": "string" }
          ],
          "answer": "A"
        }
      ]
    }
  ]
}`;
}

// ─── Response Parser + Validator ─────────────────────────────────────────────

function parseAndValidate(
  raw: string,
  input: AssignmentInput,
): GeneratedAssessment {
  // Strip any accidental markdown fences
  const cleaned = raw
    .replace(/^```(?:json)?\n?/m, "")
    .replace(/\n?```$/m, "")
    .trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("LLM returned invalid JSON — cannot parse assessment");
  }

  // Validate top-level structure
  if (!parsed.sections || !Array.isArray(parsed.sections)) {
    throw new Error("LLM response missing sections array");
  }

  // Validate and normalize each section
  const sections: AssessmentSection[] = parsed.sections
    .map((rawSection: any, sIdx: number) => {
      const config = input.sections[sIdx];
      if (!config) {
        // LLM created extra section, we trim it
        return null;
      }

      if (!rawSection.questions || !Array.isArray(rawSection.questions)) {
        throw new Error(`Section ${rawSection.name} has no questions array`);
      }

      // Validate question count matches spec
      if (rawSection.questions.length !== config.questionCount) {
        rawSection.questions = rawSection.questions.slice(
          0,
          config.questionCount,
        );
      }

      const questions: Question[] = rawSection.questions.map(
        (q: any, qIdx: number) => {
          if (!q.text || typeof q.text !== "string") {
            throw new Error(
              `Question ${qIdx + 1} in Section ${rawSection.name} has no text`,
            );
          }

          const validDifficulties: Difficulty[] = ["easy", "medium", "hard"];
          const difficulty: Difficulty = validDifficulties.includes(
            q.difficulty,
          )
            ? q.difficulty
            : "medium";

          const validTypes: QuestionType[] = [
            "mcq",
            "short_answer",
            "long_answer",
            "true_false",
            "fill_blank",
          ];
          const type: QuestionType = validTypes.includes(q.type)
            ? q.type
            : config.questionType;

          if (type === "mcq") {
            if (!q.options || q.options.length !== 4) {
              throw new Error(
                `MCQ question "${q.text.slice(0, 30)}..." must have exactly 4 options`,
              );
            }
          }

          return {
            id:
              q.id || `${rawSection.name?.replace("Section ", "")}${qIdx + 1}`,
            number: qIdx + 1,
            text: String(q.text).trim(),
            type,
            difficulty,
            marks:
              typeof q.marks === "number" ? q.marks : config.marksPerQuestion,
            options: type === "mcq" ? q.options : undefined,
            answer: q.answer,
          };
        },
      );

      // If fewer questions generated, pad them
      while (questions.length < config.questionCount) {
        const qIdx = questions.length;
        questions.push({
          id: `${config.name}${qIdx + 1}`,
          number: qIdx + 1,
          text: `Additional question about ${input.topic} (Difficulty: Medium)`,
          type: config.questionType,
          difficulty: "medium",
          marks: config.marksPerQuestion,
          options:
            config.questionType === "mcq"
              ? [
                  { label: "A", text: "Option A" },
                  { label: "B", text: "Option B" },
                  { label: "C", text: "Option C" },
                  { label: "D", text: "Option D" },
                ]
              : undefined,
          answer: "A",
        });
      }

      const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

      return {
        name: rawSection.name || `Section ${config.name}`,
        questionType: config.questionType,
        instructions: rawSection.instructions || config.instructions,
        totalMarks,
        questions,
      };
    })
    .filter(Boolean) as AssessmentSection[];

  return {
    id: "",
    assignmentId: "",
    title: String(parsed.title || input.title),
    subject: String(parsed.subject || input.subject),
    topic: String(parsed.topic || input.topic),
    gradeLevel: String(parsed.gradeLevel || input.gradeLevel),
    dueDate: String(parsed.dueDate || input.dueDate),
    totalMarks:
      typeof parsed.totalMarks === "number"
        ? parsed.totalMarks
        : input.totalMarks,
    duration: parsed.duration || "2 hours",
    generalInstructions: Array.isArray(parsed.generalInstructions)
      ? parsed.generalInstructions.map(String)
      : [
          "Attempt all questions",
          "All answers must be written in the answer sheet",
        ],
    sections,
    generatedAt: new Date().toISOString(),
    status: "complete",
  };
}

// ─── Mock Assessment Generator ────────────────────────────────────────────────

function generateMockAssessment(input: AssignmentInput): GeneratedAssessment {
  const sections: AssessmentSection[] = input.sections.map((sec) => {
    const questions: Question[] = [];

    // Distribute difficulties based on mix
    const diffs: Difficulty[] = [];
    const totalCount = sec.questionCount;

    // Distribute difficulty array
    const easyCount = Math.round(totalCount * (sec.difficultyMix.easy / 100));
    const mediumCount = Math.round(
      totalCount * (sec.difficultyMix.medium / 100),
    );
    const hardCount = totalCount - easyCount - mediumCount;

    for (let i = 0; i < easyCount; i++) diffs.push("easy");
    for (let i = 0; i < mediumCount; i++) diffs.push("medium");
    for (let i = 0; i < hardCount; i++) diffs.push("hard");

    for (let i = 0; i < totalCount; i++) {
      const qNum = i + 1;
      const diff = diffs[i] || "medium";
      let text = "";
      let options: { label: string; text: string }[] | undefined;
      let answer = "";

      const lowerSubject = input.subject.toLowerCase();
      const lowerTopic = input.topic.toLowerCase();

      if (sec.questionType === "mcq") {
        if (
          lowerSubject.includes("math") ||
          lowerSubject.includes("algebra") ||
          lowerSubject.includes("calc")
        ) {
          text = `What is the value of x when resolving the equation for ${input.topic} under a ${diff} difficulty parameter?`;
          options = [
            { label: "A", text: "x = 4" },
            { label: "B", text: "x = 12" },
            { label: "C", text: "x = -2" },
            { label: "D", text: "None of the above" },
          ];
          answer = "A";
        } else if (
          lowerSubject.includes("history") ||
          lowerSubject.includes("social")
        ) {
          text = `Which major event or document in the historical study of ${input.topic} marks the transition of regional authority?`;
          options = [
            { label: "A", text: "The treaty signing of 1848" },
            { label: "B", text: "The proclamation of independence" },
            { label: "C", text: "The industrial revolution adaptation" },
            { label: "D", text: "The local assembly declaration" },
          ];
          answer = "B";
        } else if (
          lowerSubject.includes("science") ||
          lowerSubject.includes("physics") ||
          lowerSubject.includes("chem") ||
          lowerSubject.includes("bio")
        ) {
          text = `Which of the following describes the key biochemical/physical properties observed in ${input.topic} under ${diff} testing environments?`;
          options = [
            { label: "A", text: "A rapid increase in kinetic heat capacity" },
            { label: "B", text: "Hydrogen bonding reconfiguration" },
            { label: "C", text: "Covalent bonds structural disintegration" },
            { label: "D", text: "No observable chemical changes occur" },
          ];
          answer = "C";
        } else {
          text = `Which of the following constitutes the primary element or standard definition for the study of ${input.topic}?`;
          options = [
            { label: "A", text: "The foundational core system theory" },
            { label: "B", text: "Secondary derivative variations" },
            { label: "C", text: "External contextual elements" },
            { label: "D", text: "All options are equally applicable" },
          ];
          answer = "D";
        }
      } else if (sec.questionType === "true_false") {
        text = `True or False: The application of ${input.topic} has been proven to yield optimal results only under controlled experimental settings.`;
        options = [
          { label: "A", text: "True" },
          { label: "B", text: "False" },
        ];
        answer = "A";
      } else if (sec.questionType === "fill_blank") {
        text = `Complete the statement: The core component driving the development of ________ is essential to modern study of ${input.topic}.`;
        answer = "methodology";
      } else if (sec.questionType === "short_answer") {
        text = `Briefly explain the role of ${input.topic} in modern academic research and list at least two common applications.`;
        answer = "Explain role of topic and list two applications.";
      } else {
        // long_answer
        text = `Provide a comprehensive analysis of ${input.topic}. Discuss its origin, key concepts, structural challenges, and future trends in the context of ${input.subject} for the ${input.gradeLevel} curriculum.`;
        answer =
          "Comprehensive discussion about origin, concepts, and challenges.";
      }

      // If text from PDF is provided, blend it in creatively!
      if (input.uploadedFileText) {
        text =
          `[Reference Material Text Base] ` +
          text +
          ` Reference text context snippet: "${input.uploadedFileText.trim().substring(0, 80)}..."`;
      }

      questions.push({
        id: `${sec.name}${qNum}`,
        number: qNum,
        text,
        type: sec.questionType,
        difficulty: diff,
        marks: sec.marksPerQuestion,
        options,
        answer,
      });
    }

    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

    return {
      name: `Section ${sec.name}`,
      questionType: sec.questionType,
      instructions: sec.instructions,
      totalMarks,
      questions,
    };
  });

  return {
    id: "",
    assignmentId: "",
    title: input.title,
    subject: input.subject,
    topic: input.topic,
    gradeLevel: input.gradeLevel,
    dueDate: input.dueDate,
    totalMarks: input.totalMarks,
    duration: "2 hours 30 minutes",
    generalInstructions: [
      "Read all questions carefully before attempting.",
      "Write your answers clearly in the spaces provided.",
      "No calculators or outside reference materials are allowed unless specified by the supervisor.",
    ],
    sections,
    generatedAt: new Date().toISOString(),
    status: "complete",
  };
}

// ─── Main Generate Function ──────────────────────────────────────────────────

export async function generateAssessment(
  input: AssignmentInput,
  onProgress?: (message: string) => void,
): Promise<GeneratedAssessment> {
  if (isMockMode()) {
    onProgress?.(
      "Gemini API key not detected. Initializing creative mock fallback...",
    );
    await new Promise((resolve) => setTimeout(resolve, 800));
    onProgress?.("Generating structured questions for " + input.topic + "...");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    onProgress?.("Validating layout structure...");
    await new Promise((resolve) => setTimeout(resolve, 500));
    const mockData = generateMockAssessment(input);
    onProgress?.("Validation complete");
    return mockData;
  }

  const prompt = buildPrompt(input);
  const maxRetries = 3;
  const timeoutMs = 25000; // 25 seconds timeout per attempt

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const attemptMsg =
        attempt > 1 ? ` (Attempt ${attempt}/${maxRetries})` : "";
      onProgress?.(
        `Sending request to Gemini API (${env.OPENROUTER_MODEL})${attemptMsg}...`,
      );

      const apiCallPromise = client.chat.completions.create({
        model: env.OPENROUTER_MODEL,
        messages: [
          {
            role: "system",
            content: `You are an expert educator and exam paper creator.
You always return valid JSON and nothing else.
Never include markdown formatting, code blocks, or explanatory text outside the JSON object.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                `Gemini API request timed out after ${timeoutMs / 1000} seconds`,
              ),
            ),
          timeoutMs,
        ),
      );

      const response = await Promise.race([apiCallPromise, timeoutPromise]);

      const rawText = response.choices?.[0]?.message?.content || "";
      onProgress?.("Parsing and validating AI response...");

      const assessment = parseAndValidate(rawText, input);
      onProgress?.("Validation complete");
      return assessment;
    } catch (err: any) {
      console.error(`[AI Gen] Attempt ${attempt} failed: ${err.message}`);

      if (attempt < maxRetries) {
        let delay = attempt * 2000; // Standard backoff: 2s, 4s
        const isRateLimit =
          err.status === 429 ||
          String(err.message).includes("429") ||
          String(err.message).toLowerCase().includes("rate limit") ||
          String(err.message).toLowerCase().includes("too many requests");

        if (isRateLimit) {
          delay = attempt * 5000; // Rate limit recovery backoff: 5s, 10s
          onProgress?.(
            `Rate limit hit (429). Backing off and retrying in ${delay / 1000}s...`,
          );
        } else {
          onProgress?.(
            `Attempt ${attempt} failed: ${err.message}. Retrying in ${delay / 1000}s...`,
          );
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        // Ultimate failure: log and throw the error (no mock fallback!)
        onProgress?.(`All ${maxRetries} API attempts failed. Raising error...`);
        throw new Error(
          `Gemini API generation failed after ${maxRetries} attempts. Last error: ${err.message}`,
        );
      }
    }
  }

  throw new Error("Unexpected end of retry loop");
}
