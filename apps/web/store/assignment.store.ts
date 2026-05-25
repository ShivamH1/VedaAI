import { create } from 'zustand';

export type QuestionType = "mcq" | "short_answer" | "long_answer" | "true_false" | "fill_blank";
export type Difficulty = "easy" | "medium" | "hard";
export type DifficultyMix = { easy: number; medium: number; hard: number };

export interface SectionConfig {
  id: string;
  name: string;
  questionType: QuestionType;
  questionCount: number;
  marksPerQuestion: number;
  instructions: string;
  difficultyMix: DifficultyMix;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  topic: string;
  gradeLevel: string;
  dueDate: string;
  assignedDate: string;
  totalMarks: number;
  sections: SectionConfig[];
  additionalInstructions: string;
  fileName?: string;
  status: "pending" | "generating" | "complete" | "failed";
}

interface AssignmentStore {
  assignments: Assignment[];
  addAssignment: (assignment: Omit<Assignment, 'id' | 'assignedDate' | 'status'>) => void;
  deleteAssignment: (id: string) => void;
  clearAssignments: () => void;
  resetToMockData: () => void;
}

const mockAssignments: Assignment[] = [
  {
    id: "1",
    title: "Quiz on Electricity",
    subject: "Physics",
    topic: "Electric Current & Circuits",
    gradeLevel: "Grade 10",
    assignedDate: "20-06-2025",
    dueDate: "21-06-2025",
    totalMarks: 60,
    status: "complete",
    additionalInstructions: "",
    sections: [
      {
        id: "s1",
        name: "Section A",
        questionType: "mcq",
        questionCount: 10,
        marksPerQuestion: 1,
        instructions: "Attempt all multiple choice questions.",
        difficultyMix: { easy: 40, medium: 40, hard: 20 }
      }
    ]
  },
  {
    id: "2",
    title: "Quiz on Electricity",
    subject: "Physics",
    topic: "Ohm's Law",
    gradeLevel: "Grade 10",
    assignedDate: "20-06-2025",
    dueDate: "21-06-2025",
    totalMarks: 45,
    status: "complete",
    additionalInstructions: "",
    sections: []
  },
  {
    id: "3",
    title: "Quiz on Electricity",
    subject: "Physics",
    topic: "Resistance & Resistivity",
    gradeLevel: "Grade 10",
    assignedDate: "20-06-2025",
    dueDate: "21-06-2025",
    totalMarks: 50,
    status: "complete",
    additionalInstructions: "",
    sections: []
  },
  {
    id: "4",
    title: "Quiz on Electricity",
    subject: "Physics",
    topic: "Heating Effect of Current",
    gradeLevel: "Grade 10",
    assignedDate: "20-06-2025",
    dueDate: "21-06-2025",
    totalMarks: 30,
    status: "complete",
    additionalInstructions: "",
    sections: []
  },
  {
    id: "5",
    title: "Quiz on Electricity",
    subject: "Physics",
    topic: "Electric Power",
    gradeLevel: "Grade 10",
    assignedDate: "20-06-2025",
    dueDate: "21-06-2025",
    totalMarks: 60,
    status: "complete",
    additionalInstructions: "",
    sections: []
  },
  {
    id: "6",
    title: "Quiz on Electricity",
    subject: "Physics",
    topic: "Electromagnetism Intro",
    gradeLevel: "Grade 10",
    assignedDate: "20-06-2025",
    dueDate: "21-06-2025",
    totalMarks: 40,
    status: "complete",
    additionalInstructions: "",
    sections: []
  }
];

export const useAssignmentStore = create<AssignmentStore>((set) => ({
  assignments: mockAssignments,
  addAssignment: (newAssignment) => set((state) => {
    const today = new Date();
    const formattedToday = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
    
    // Convert YYYY-MM-DD input date to DD-MM-YYYY display date
    let formattedDueDate = newAssignment.dueDate;
    if (newAssignment.dueDate.includes("-")) {
      const parts = newAssignment.dueDate.split("-");
      const [y, m, d] = parts;
      if (y && m && d && y.length === 4) {
        // YYYY-MM-DD
        formattedDueDate = `${d}-${m}-${y}`;
      }
    }

    const assignment: Assignment = {
      ...newAssignment,
      dueDate: formattedDueDate,
      id: Math.random().toString(36).substring(2, 9),
      assignedDate: formattedToday,
      status: "complete", // Create directly in complete state for mock purposes
    };
    return { assignments: [assignment, ...state.assignments] };
  }),
  deleteAssignment: (id) => set((state) => ({
    assignments: state.assignments.filter((a) => a.id !== id),
  })),
  clearAssignments: () => set({ assignments: [] }),
  resetToMockData: () => set({ assignments: mockAssignments }),
}));
