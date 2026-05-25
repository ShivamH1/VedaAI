"use client";

import { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { GeneratedAssessment, QuestionType } from "@/types";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MobileFooterNav from "@/components/layout/MobileFooterNav";
import { ArrowLeft, Download, RotateCcw } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AssessmentResult({ params }: PageProps) {
  const router = useRouter();
  const { id: assignmentId } = use(params);
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("assessmentId");

  const [assessment, setAssessment] = useState<GeneratedAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    if (!assessmentId) {
      setError("No assessment ID provided in the URL.");
      setIsLoading(false);
      return;
    }

    const fetchAssessment = async () => {
      try {
        setIsLoading(true);
        // Fetch completed assessment including answers
        const data = await api.getAssessment(assessmentId, true);
        setAssessment(data);
      } catch (err: any) {
        setError(err.message || "Failed to load assessment data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssessment();
  }, [assessmentId]);

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

  const handleDownload = () => {
    window.print();
  };

  const handleRegenerate = async () => {
    if (!assessmentId) return;
    try {
      setIsRegenerating(true);
      const result = await api.regenerateAssessment(assessmentId);
      // Redirect back to progress loader page using the assignment ID
      router.push(`/assessment/${result.assignmentId}`);
    } catch (err: any) {
      alert(err.message || "Failed to queue regeneration job");
      setIsRegenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#ececee] text-text-primary">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 p-3 lg:pl-0 h-screen overflow-y-auto pb-24 lg:pb-3">
          <div className="hidden lg:block mb-3">
            <Header title="Result Sheet" showBack />
          </div>
          <main className="flex-1 flex flex-col items-center justify-center bg-white rounded-custom-xl border border-border-subtle shadow-premium p-6 min-h-[500px]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-semibold text-text-secondary">Loading question paper...</span>
            </div>
          </main>
        </div>
        <MobileFooterNav />
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="flex min-h-screen bg-[#ececee] text-text-primary">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 p-3 lg:pl-0 h-screen overflow-y-auto pb-24 lg:pb-3">
          <div className="hidden lg:block mb-3">
            <Header title="Result Sheet" showBack />
          </div>
          <main className="flex-1 flex flex-col items-center justify-center bg-white rounded-custom-xl border border-border-subtle shadow-premium p-6 min-h-[500px]">
            <div className="flex flex-col gap-4 items-center justify-center max-w-[480px] w-full text-center">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center border border-red-200 shadow-sm">
                <span className="text-2xl font-bold">✕</span>
              </div>
              <h3 className="text-xl font-bold text-text-primary">Failed to load Assessment</h3>
              <p className="text-sm text-text-secondary">{error || "Assessment not found"}</p>
              <button
                onClick={() => router.push("/")}
                className="mt-4 px-6 py-3 bg-[#111115] hover:bg-[#212128] text-white font-bold text-xs rounded-full shadow-md transition-all cursor-pointer"
              >
                Go to Dashboard
              </button>
            </div>
          </main>
        </div>
        <MobileFooterNav />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#ececee] text-text-primary print:bg-white print:p-0">
      {/* Sidebar - Laptop View (hidden on print) */}
      <div className="print:hidden">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 p-3 lg:pl-0 h-screen overflow-y-auto pb-24 lg:pb-3 print:h-auto print:overflow-visible print:p-0">
        {/* Laptop Header (hidden on print) */}
        <div className="hidden lg:block mb-3 print:hidden">
          <Header title="Assignment Sheet" showBack />
        </div>

        {/* Mobile Header Bar (hidden on print) */}
        <div className="lg:hidden flex items-center justify-between px-1 py-2 mb-2 print:hidden">
          <button
            onClick={() => router.push("/")}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-border-subtle"
          >
            <ArrowLeft className="w-4 h-4 text-text-secondary" />
          </button>
          <span className="font-bold text-base">Assignment Sheet</span>
          <div className="flex gap-2">
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="flex items-center justify-center px-3 h-8 rounded-full bg-[#111115] text-white text-[10px] font-bold border border-border-subtle"
              title="Regenerate"
            >
              <span>{isRegenerating ? "..." : "Regen"}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-border-subtle text-brand"
              title="Download PDF"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <main className="flex-1 flex flex-col max-w-[800px] mx-auto w-full gap-5 print:max-w-full print:mx-0">
          
          {/* 1. Dark Info / Feedback Banner (hidden on print) */}
          <div className="bg-[#24242b] rounded-custom-xl p-5 md:p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg border border-gray-800 print:hidden">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold tracking-tight">
                Certainly, Teacher! Here is a customized Question Paper for your class:
              </span>
              <span className="text-xs text-gray-400">
                Generated based on {assessment.gradeLevel} • {assessment.subject} ({assessment.topic}).
              </span>
            </div>
            
            {/* Desktop Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="flex items-center gap-2 px-5 py-3 bg-[#e05e35] hover:bg-[#c94d27] text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4 text-white" />
                <span>{isRegenerating ? "Regenerating..." : "Regenerate"}</span>
              </button>

              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-5 py-3 bg-white text-[#24242b] hover:bg-gray-100 font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#24242b]" />
                <span>Download as PDF</span>
              </button>
            </div>
          </div>

          {/* 2. White Paper Document Sheet */}
          <article className="bg-white border border-border-subtle rounded-custom-xl shadow-premium px-6 py-10 md:px-12 md:py-14 flex flex-col gap-8 select-all print:border-none print:shadow-none print:p-0">
            
            {/* Document Header */}
            <div className="flex flex-col items-center text-center gap-1.5 border-b border-gray-100 pb-6 print:pb-4">
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-text-primary uppercase">
                {assessment.title || `${assessment.subject} Assessment`}
              </h1>
              <h2 className="text-sm md:text-base font-bold text-text-secondary">
                Subject: {assessment.subject}
              </h2>
              <h3 className="text-xs md:text-sm font-semibold text-text-secondary/80 uppercase">
                Class: {assessment.gradeLevel}
              </h3>
            </div>

            {/* Metainfo Row (Time & Marks) */}
            <div className="flex justify-between items-center text-xs font-bold text-text-primary select-none">
              <span>Time Allowed: {assessment.duration || "45 minutes"}</span>
              <span>Maximum Marks: {assessment.totalMarks}</span>
            </div>

            {/* General Instructions */}
            <div className="border-t border-b border-dashed border-gray-200 py-3 text-xs select-none">
              <span className="font-bold text-text-primary block mb-1">General Instructions:</span>
              <ul className="list-disc pl-5 text-text-secondary italic flex flex-col gap-0.5">
                {assessment.generalInstructions && assessment.generalInstructions.length > 0 ? (
                  assessment.generalInstructions.map((ins, idx) => (
                    <li key={idx}>{ins}</li>
                  ))
                ) : (
                  <li>All questions are compulsory unless stated otherwise.</li>
                )}
              </ul>
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
            <div className="flex flex-col gap-8">
              {assessment.sections.map((section, sIdx) => (
                <div key={sIdx} className="flex flex-col gap-5">
                  {/* Section Title */}
                  <div className="text-center font-bold text-sm tracking-widest border-b border-gray-100 pb-1 select-none">
                    {section.name || `SECTION ${String.fromCharCode(65 + sIdx)}`}
                  </div>
                  <div className="flex flex-col gap-1 select-none">
                    <span className="font-bold text-xs text-text-primary">
                      {getQuestionTypeLabel(section.questionType)}
                    </span>
                    <span className="text-[10px] text-text-secondary italic">
                      {section.instructions || `Attempt all questions. Each question carries ${section.totalMarks / section.questions.length} marks.`}
                    </span>
                  </div>

                  {/* Section Questions */}
                  <ol className="flex flex-col gap-4 list-none pl-0 text-xs text-text-primary">
                    {section.questions.map((q, qIdx) => (
                      <li key={qIdx} className="flex gap-2 items-start leading-relaxed">
                        <span className="font-bold">{qIdx + 1}.</span>
                        <div className="flex-1 flex flex-col gap-2">
                          <div>
                            <span className="text-text-secondary mr-1 capitalize">[{q.difficulty}]</span>
                            <span>{q.text}</span>
                            <span className="font-bold text-[10px] text-text-secondary pl-1 select-none">[{q.marks} Marks]</span>
                          </div>
                          {/* Option list for MCQ */}
                          {q.options && q.options.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1.5 select-none pl-4">
                              {q.options.map((opt, oIdx) => (
                                <div key={oIdx} className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-gray-50 border border-border-subtle flex items-center justify-center text-[10px] font-bold">
                                    {opt.label || String.fromCharCode(65 + oIdx)}
                                  </span>
                                  <span>{opt.text}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}

              <div className="text-center font-bold text-xs border-y border-dashed border-gray-200 py-2.5 my-4 select-none uppercase tracking-wider text-text-secondary">
                End of Question Paper
              </div>

              {/* Combined Answer Key */}
              <div className="flex flex-col gap-4 border-t border-gray-100 pt-6 print:break-before-page">
                <h3 className="font-bold text-sm text-text-primary select-none">Answer Key:</h3>
                <div className="flex flex-col gap-6">
                  {assessment.sections.map((section, sIdx) => (
                    <div key={sIdx} className="flex flex-col gap-2">
                      <span className="font-bold text-xs text-text-primary select-none">
                        {section.name || `Section ${String.fromCharCode(65 + sIdx)}`} ({getQuestionTypeLabel(section.questionType)})
                      </span>
                      <ol className="flex flex-col gap-2 list-none pl-0 text-xs text-text-secondary leading-relaxed">
                        {section.questions.map((q, qIdx) => (
                          <li key={qIdx} className="flex gap-2 items-start">
                            <span className="font-bold">{qIdx + 1}.</span>
                            <span>{q.answer || "No answer provided"}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </article>
        </main>
      </div>

      {/* Mobile Footer (hidden on print) */}
      <div className="print:hidden">
        <MobileFooterNav />
      </div>
    </div>
  );
}
