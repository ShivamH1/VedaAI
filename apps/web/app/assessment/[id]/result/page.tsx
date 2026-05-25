"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useAssignmentStore, QuestionType } from "@/store/assignment.store";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MobileFooterNav from "@/components/layout/MobileFooterNav";
import { ArrowLeft, Download } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface Question {
  number: number;
  text: string;
  difficulty: "Easy" | "Moderate" | "Challenging";
  marks: number;
  options?: string[];
  answer: string;
}

export default function AssessmentResult({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  const assignments = useAssignmentStore((state) => state.assignments);
  
  // Find assignment or fallback to first mock data
  const assignment = assignments.find((a) => a.id === id) || assignments[0];

  // If no assignments at all, redirect to home
  if (!assignment) {
    if (typeof window !== "undefined") {
      router.push("/");
    }
    return null;
  }

  const getQuestionTypeLabel = (type: QuestionType) => {
    switch (type) {
      case "mcq": return "Multiple Choice Questions";
      case "short_answer": return "Short Questions";
      case "long_answer": return "Diagram/Graph-Based Questions";
      case "fill_blank": return "Numerical Problems";
      case "true_false": return "True / False Questions";
      default: return "Questions";
    }
  };

  // Generate realistic questions based on selected question types
  const generateQuestionsForSection = (type: QuestionType, count: number, marks: number): { questions: Question[], answerKey: string[] } => {
    const questions: Question[] = [];
    const answerKey: string[] = [];

    const mcqPool = [
      { text: "Which of the following is the SI unit of electric current?", options: ["Ampere", "Volt", "Ohm", "Watt"], answer: "Ampere. The SI unit of electric current is the Ampere (A), named after André-Marie Ampère." },
      { text: "What device is used to measure electric current in a circuit?", options: ["Voltmeter", "Ammeter", "Galvanometer", "Rheostat"], answer: "Ammeter. An ammeter is connected in series to measure electric current." },
      { text: "According to Ohm's Law, the current is directly proportional to what quantity?", options: ["Resistance", "Voltage", "Power", "Charge"], answer: "Voltage. Ohm's Law states that V = IR, meaning current (I) is proportional to voltage (V) for a constant resistance." },
      { text: "What happens to the total resistance when resistors are connected in series?", options: ["It decreases", "It increases", "It remains constant", "It becomes zero"], answer: "It increases. The total resistance in series is the sum of individual resistances: Rs = R1 + R2 + ... + Rn." }
    ];

    const shortPool = [
      { text: "Define electroplating. Explain its purpose.", answer: "Electroplating is the process of depositing a thin layer of metal on the surface of another metal using electric current. Its purpose is to prevent corrosion, improve appearance, or increase thickness." },
      { text: "What is the role of a conductor in the process of electrolysis?", answer: "A conductor allows the flow of electric current, causing ions in the electrolyte to move and enabling chemical changes at electrodes." },
      { text: "Why does a solution of copper sulfate conduct electricity?", answer: "Copper sulfate solution contains free copper and sulfate ions which carry electric charge, thus conducting electricity." },
      { text: "Describe one example of the chemical effect of electric current in daily life.", answer: "An example is the electroplating of silver on jewelry to prevent tarnishing." },
      { text: "Explain why electric current is said to have chemical effects.", answer: "Electric current causes the movement of ions leading to chemical changes at the electrodes, hence it shows chemical effects." }
    ];

    const longPool = [
      { text: "Explain with a chemical equation how copper is deposited during the electroplating of an object.", answer: "At the cathode: copper ions in solution gain electrons and deposit as copper metal: Cu²⁺ + 2e⁻ → copper metal (solid)." },
      { text: "Draw a circuit diagram containing a cell, an ammeter, a voltmeter, and a resistor, showing current direction.", answer: "The diagram must show a closed loop with cell, ammeter in series, voltmeter in parallel across the resistor, and current flowing from positive to negative terminal." },
      { text: "Explain the difference between series and parallel circuits. Discuss voltage distribution in each.", answer: "In series, current is constant and voltage divides. In parallel, voltage is constant across branches and current divides. Individual branch resistance determines current." }
    ];

    const fillBlankPool = [
      { text: "The opposition to the flow of electric current is called _______.", answer: "Resistance. Resistance is the property of a material to oppose the flow of current." },
      { text: "A fuse wire should have a _______ melting point.", answer: "Low. A fuse wire has a low melting point so it melts and breaks the circuit in case of excessive current." },
      { text: "One kilowatt-hour (kWh) is equal to _______ Joules.", answer: "3.6 x 10^6. 1 kWh = 1000 W x 3600 s = 3,600,000 Joules." }
    ];

    const trueFalsePool = [
      { text: "Pure water is a good conductor of electricity.", answer: "False. Pure water contains no dissolved salts or free ions, so it is a poor conductor of electricity." },
      { text: "An electric current can produce chemical, heating, and magnetic effects.", answer: "True. Electric currents exhibit magnetic fields (electromagnetism), produce heat (Joule heating), and drive chemical reactions (electrolysis)." }
    ];

    let pool = shortPool;
    if (type === "mcq") pool = mcqPool;
    else if (type === "long_answer") pool = longPool;
    else if (type === "fill_blank") pool = fillBlankPool;
    else if (type === "true_false") pool = trueFalsePool;

    for (let i = 0; i < count; i++) {
      const item = (pool[i % pool.length] || { 
        text: "Provide detailed justification for your answer.", 
        answer: "The answer must be justified academically."
      }) as { text: string; answer: string; options?: string[] };
      const diffs: ("Easy" | "Moderate" | "Challenging")[] = ["Easy", "Moderate", "Challenging"];
      const difficulty = diffs[i % diffs.length] || "Moderate";

      questions.push({
        number: i + 1,
        text: item.text,
        difficulty,
        marks,
        options: item.options,
        answer: item.answer
      });

      answerKey.push(`${i + 1}. ${item.answer}`);
    }

    return { questions, answerKey };
  };

  const handleDownload = () => {
    alert("Downloading PDF... Your printable question paper is ready!");
  };

  return (
    <div className="flex min-h-screen bg-[#ececee] text-text-primary">
      {/* Sidebar - Laptop View */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 p-3 lg:pl-0 h-screen overflow-y-auto pb-24 lg:pb-3">
        {/* Laptop Header */}
        <div className="hidden lg:block mb-3">
          <Header title="Create New" showBack />
        </div>

        {/* Mobile Header Bar */}
        <div className="lg:hidden flex items-center justify-between px-1 py-2 mb-2">
          <button
            onClick={() => router.push("/")}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-border-subtle"
          >
            <ArrowLeft className="w-4 h-4 text-text-secondary" />
          </button>
          <span className="font-bold text-base">Assignment Sheet</span>
          <button
            onClick={handleDownload}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-border-subtle text-brand"
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <main className="flex-1 flex flex-col max-w-[800px] mx-auto w-full gap-5">
          
          {/* 1. Dark Info / Feedback Banner */}
          <div className="bg-[#24242b] rounded-custom-xl p-5 md:p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg border border-gray-800">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold tracking-tight">
                Certainly, Teacher! Here is a customized Question Paper for your class:
              </span>
              <span className="text-xs text-gray-400">
                Generated based on {assignment.gradeLevel} • {assignment.subject} ({assignment.topic}).
              </span>
            </div>
            
            {/* Desktop Download Button */}
            <button
              onClick={handleDownload}
              className="hidden sm:flex items-center gap-2 px-5 py-3 bg-white text-[#24242b] hover:bg-gray-100 font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer flex-shrink-0"
            >
              <Download className="w-4 h-4 text-[#24242b]" />
              <span>Download as PDF</span>
            </button>
          </div>

          {/* 2. White Paper Document Sheet */}
          <article className="bg-white border border-border-subtle rounded-custom-xl shadow-premium px-6 py-10 md:px-12 md:py-14 flex flex-col gap-8 select-all">
            
            {/* Document Header */}
            <div className="flex flex-col items-center text-center gap-1.5 border-b border-gray-100 pb-6">
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-text-primary uppercase">
                Delhi Public School, Sector-4, Bokaro
              </h1>
              <h2 className="text-sm md:text-base font-bold text-text-secondary">
                Subject: {assignment.subject}
              </h2>
              <h3 className="text-xs md:text-sm font-semibold text-text-secondary/80 uppercase">
                Class: {assignment.gradeLevel}
              </h3>
            </div>

            {/* Metainfo Row (Time & Marks) */}
            <div className="flex justify-between items-center text-xs font-bold text-text-primary select-none">
              <span>Time Allowed: 45 minutes</span>
              <span>Maximum Marks: {assignment.totalMarks}</span>
            </div>

            {/* General Instructions */}
            <div className="border-t border-b border-dashed border-gray-200 py-3 text-xs select-none">
              <span className="font-bold text-text-primary block mb-1">General Instructions:</span>
              <span className="text-text-secondary italic">All questions are compulsory unless stated otherwise.</span>
            </div>

            {/* Student Blank Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold select-none">
              <div className="flex items-center gap-2">
                <span>Name:</span>
                <div className="flex-1 border-b border-gray-400 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <span>Roll Number:</span>
                <div className="flex-1 border-b border-gray-400 h-4" />
              </div>
              <div className="flex items-center gap-2 md:col-span-2">
                <span>Class & Section:</span>
                <div className="w-full border-b border-gray-400 h-4" />
              </div>
            </div>

            {/* Structured Questions Sections */}
            {assignment.sections.length === 0 ? (
              // Fallback default sections if no configuration exists (matches Image 2 and 3)
              <div className="flex flex-col gap-6 mt-4">
                <div className="text-center font-bold text-sm tracking-widest border-b border-gray-100 pb-1 select-none">SECTION A</div>
                <div className="flex flex-col gap-1.5 select-none">
                  <span className="font-bold text-xs text-text-primary">Short Answer Questions</span>
                  <span className="text-[10px] text-text-secondary italic">Attempt all questions. Each question carries 2 marks</span>
                </div>

                <ol className="flex flex-col gap-4 list-none pl-0 text-xs text-text-primary">
                  {[
                    { text: "Define electroplating. Explain its purpose.", diff: "Easy", marks: 2 },
                    { text: "What is the role of a conductor in the process of electrolysis?", diff: "Moderate", marks: 2 },
                    { text: "Why does a solution of copper sulfate conduct electricity?", diff: "Easy", marks: 2 },
                    { text: "Describe one example of the chemical effect of electric current in daily life.", diff: "Moderate", marks: 2 },
                    { text: "Explain why electric current is said to have chemical effects.", diff: "Moderate", marks: 2 },
                    { text: "How is sodium hydroxide prepared during the electrolysis of brine? Write the chemical reaction involved.", diff: "Challenging", marks: 2 },
                    { text: "What happens at the cathode and anode during the electrolysis of water? Name the gases evolved.", diff: "Challenging", marks: 2 },
                    { text: "Mention the type of current used in electroplating and justify why it is used.", diff: "Easy", marks: 2 },
                    { text: "What is the importance of electric current in the field of metallurgy?", diff: "Moderate", marks: 2 },
                    { text: "Explain with a chemical equation how copper is deposited during the electroplating of an object.", diff: "Challenging", marks: 2 }
                  ].map((q, idx) => (
                    <li key={idx} className="flex gap-2 items-start leading-relaxed">
                      <span className="font-bold">{idx + 1}.</span>
                      <div className="flex-1">
                        <span className="text-text-secondary mr-1">[{q.diff}]</span>
                        <span>{q.text}</span>
                        <span className="font-bold text-[10px] text-text-secondary pl-1 select-none">[{q.marks} Marks]</span>
                      </div>
                    </li>
                  ))}
                </ol>

                <div className="text-center font-bold text-xs border-y border-dashed border-gray-200 py-2.5 my-4 select-none uppercase tracking-wider text-text-secondary">
                  End of Question Paper
                </div>

                <div className="flex flex-col gap-4 border-t border-gray-100 pt-6">
                  <h3 className="font-bold text-sm text-text-primary select-none">Answer Key:</h3>
                  <ol className="flex flex-col gap-3 list-none pl-0 text-xs text-text-secondary leading-relaxed">
                    {[
                      "Electroplating is the process of depositing a thin layer of metal on the surface of another metal using electric current. Its purpose is to prevent corrosion, improve appearance, or increase thickness.",
                      "A conductor allows the flow of electric current, causing ions in the electrolyte to move and enabling chemical changes at electrodes.",
                      "Copper sulfate solution contains free copper and sulfate ions which carry electric charge, thus conducting electricity.",
                      "An example is the electroplating of silver on jewelry to prevent tarnishing.",
                      "Electric current causes the movement of ions leading to chemical changes at the electrodes, hence it shows chemical effects.",
                      "Sodium hydroxide is formed at the cathode during brine electrolysis as water gains electrons: 2H2O + 2e- -> H2 + 2OH-. Na+ + OH- -> NaOH (in solution).",
                      "At the cathode: water is reduced to hydrogen gas and hydroxide ions. At the anode: water is oxidized to oxygen gas and hydrogen ions.",
                      "Direct current (DC) is used because it produces a consistent flow of electrons necessary for controlled deposition of metals.",
                      "Electric current helps extract metals from their ores and purify metals by electrolysis in metallurgy.",
                      "During copper electroplating, copper ions in solution gain electrons at the cathode and deposit as copper metal: Cu2+ + 2e- -> Cu (solid)."
                    ].map((ans, idx) => (
                      <li key={idx} className="flex gap-2 items-start">
                        <span className="font-bold">{idx + 1}.</span>
                        <span>{ans}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            ) : (
              // Render custom sections dynamically configured by the teacher
              <div className="flex flex-col gap-8">
                {assignment.sections.map((section, sIdx) => {
                  const { questions } = generateQuestionsForSection(
                    section.questionType, 
                    section.questionCount, 
                    section.marksPerQuestion
                  );

                  return (
                    <div key={section.id} className="flex flex-col gap-5">
                      {/* Section Title */}
                      <div className="text-center font-bold text-sm tracking-widest border-b border-gray-100 pb-1 select-none">
                        SECTION {String.fromCharCode(65 + sIdx)}
                      </div>
                      <div className="flex flex-col gap-1 select-none">
                        <span className="font-bold text-xs text-text-primary">
                          {getQuestionTypeLabel(section.questionType)}
                        </span>
                        <span className="text-[10px] text-text-secondary italic">
                          {section.instructions || `Attempt all questions. Each question carries ${section.marksPerQuestion} marks.`}
                        </span>
                      </div>

                      {/* Section Questions */}
                      <ol className="flex flex-col gap-4 list-none pl-0 text-xs text-text-primary">
                        {questions.map((q) => (
                          <li key={q.number} className="flex gap-2 items-start leading-relaxed">
                            <span className="font-bold">{q.number}.</span>
                            <div className="flex-1 flex flex-col gap-2">
                              <div>
                                <span className="text-text-secondary mr-1">[{q.difficulty}]</span>
                                <span>{q.text}</span>
                                <span className="font-bold text-[10px] text-text-secondary pl-1 select-none">[{q.marks} Marks]</span>
                              </div>
                              {/* Option list for MCQ */}
                              {q.options && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1.5 select-none pl-4">
                                  {q.options.map((opt, oIdx) => (
                                    <div key={oIdx} className="flex items-center gap-2">
                                      <span className="w-5 h-5 rounded-full bg-gray-50 border border-border-subtle flex items-center justify-center text-[10px] font-bold">
                                        {String.fromCharCode(65 + oIdx)}
                                      </span>
                                      <span>{opt}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>
                  );
                })}

                <div className="text-center font-bold text-xs border-y border-dashed border-gray-200 py-2.5 my-4 select-none uppercase tracking-wider text-text-secondary">
                  End of Question Paper
                </div>

                {/* Combined Answer Key */}
                <div className="flex flex-col gap-4 border-t border-gray-100 pt-6">
                  <h3 className="font-bold text-sm text-text-primary select-none">Answer Key:</h3>
                  <div className="flex flex-col gap-6">
                    {assignment.sections.map((section, sIdx) => {
                      const { questions } = generateQuestionsForSection(
                        section.questionType, 
                        section.questionCount, 
                        section.marksPerQuestion
                      );

                      return (
                        <div key={section.id} className="flex flex-col gap-2">
                          <span className="font-bold text-xs text-text-primary select-none">
                            Section {String.fromCharCode(65 + sIdx)} ({getQuestionTypeLabel(section.questionType)})
                          </span>
                          <ol className="flex flex-col gap-2 list-none pl-0 text-xs text-text-secondary leading-relaxed">
                            {questions.map((q) => (
                              <li key={q.number} className="flex gap-2 items-start">
                                <span className="font-bold">{q.number}.</span>
                                <span>{q.answer}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

          </article>
        </main>
      </div>

      {/* Mobile Footer */}
      <MobileFooterNav />
    </div>
  );
}
