"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { QuestionType } from "@/types";
import { 
  ArrowLeft, 
  UploadCloud, 
  Calendar, 
  Plus, 
  X, 
  Mic, 
  ArrowRight,
  FileText,
  Trash2
} from "lucide-react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import MobileFooterNav from "@/components/layout/MobileFooterNav";
import { clsx } from "clsx";

interface QuestionTypeRow {
  id: string;
  type: QuestionType;
  count: number;
  marks: number;
}

export default function CreateAssignment() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("Electricity Mid-Term Exam");
  const [subject, setSubject] = useState("Physics");
  const [topic, setTopic] = useState("Electric Current & Ohm's Law");
  const [gradeLevel, setGradeLevel] = useState("Grade 10");
  const [dueDate, setDueDate] = useState("2026-06-21");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic list of question types
  const [rows, setRows] = useState<QuestionTypeRow[]>([
    { id: "1", type: "mcq", count: 4, marks: 1 },
    { id: "2", type: "short_answer", count: 3, marks: 2 },
    { id: "3", type: "long_answer", count: 5, marks: 5 },
    { id: "4", type: "fill_blank", count: 5, marks: 5 },
  ]);

  // Recalculated values
  const totalQuestions = rows.reduce((sum, r) => sum + r.count, 0);
  const totalMarks = rows.reduce((sum, r) => sum + (r.count * r.marks), 0);

  // Question Type Label translation
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

  // Row operations
  const addRow = () => {
    const newId = Math.random().toString(36).substring(2, 9);
    setRows([...rows, { id: newId, type: "mcq", count: 1, marks: 1 }]);
  };

  const removeRow = (id: string) => {
    setRows(rows.filter((r) => r.id !== id));
  };

  const updateRow = (id: string, field: keyof QuestionTypeRow, value: QuestionTypeRow[keyof QuestionTypeRow]) => {
    setRows(rows.map((r) => r.id === id ? { ...r, [field]: value } : r));
  };

  const incrementCount = (id: string) => {
    const row = rows.find(r => r.id === id);
    if (row) updateRow(id, "count", row.count + 1);
  };

  const decrementCount = (id: string) => {
    const row = rows.find(r => r.id === id);
    if (row && row.count > 1) updateRow(id, "count", row.count - 1);
  };

  const incrementMarks = (id: string) => {
    const row = rows.find(r => r.id === id);
    if (row) updateRow(id, "marks", row.marks + 1);
  };

  const decrementMarks = (id: string) => {
    const row = rows.find(r => r.id === id);
    if (row && row.marks > 1) updateRow(id, "marks", row.marks - 1);
  };

  // File drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const triggerBrowse = () => {
    fileInputRef.current?.click();
  };

  const clearUploadedFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedFile(null);
  };

  // Form submission
  const handleSubmit = async () => {
    if (!title || !subject || !topic) {
      alert("Please fill out the Title, Subject, and Topic fields.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const sections = rows.map((r, index) => ({
      name: `Section ${String.fromCharCode(65 + index)}`,
      questionType: r.type,
      questionCount: r.count,
      marksPerQuestion: r.marks,
      instructions: `Attempt all ${getQuestionTypeLabel(r.type).toLowerCase()}.`,
      difficultyMix: { easy: 34, medium: 33, hard: 33 }
    }));

    try {
      const result = await api.createAssignment({
        title,
        subject,
        topic,
        gradeLevel,
        dueDate,
        sections,
        additionalInstructions: additionalInfo
      }, uploadedFile || undefined);

      router.push(`/assessment/${result.assignmentId}`);
    } catch (err: any) {
      setError(err.message || "Failed to create assignment");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#ececee] text-text-primary">
      {/* Sidebar - Laptop View */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 p-3 lg:pl-0 h-screen overflow-y-auto pb-32">
        {/* Laptop Header */}
        <div className="hidden lg:block mb-3">
          <Header title="Create Assignment" showBack />
        </div>

        {/* Form Container */}
        <main className="flex-1 flex flex-col max-w-[840px] mx-auto w-full gap-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}
          
          {/* Mobile Back bar */}
          <div className="lg:hidden flex items-center gap-3 px-1 py-2">
            <button
              onClick={() => router.push("/")}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-border-subtle"
            >
              <ArrowLeft className="w-4 h-4 text-text-secondary" />
            </button>
            <span className="font-bold text-lg">Create Assignment</span>
          </div>

          {/* Stepper Progress bar */}
          <div className="flex flex-col gap-2 px-1 select-none">
            <div className="flex items-center justify-between text-xs text-text-secondary font-semibold">
              <span className="text-[#111115]">1. Assignment Details</span>
              <span>2. Output Review</span>
            </div>
            <div className="w-full h-1.5 bg-gray-300 rounded-full overflow-hidden flex">
              <div className="w-1/2 h-full bg-[#1e1e24]" />
              <div className="w-1/2 h-full bg-gray-300" />
            </div>
          </div>

          {/* Main Card Content */}
          <div className="bg-white rounded-custom-xl border border-border-subtle shadow-premium p-6 md:p-8 flex flex-col gap-6">
            
            {/* Title & Subtitle */}
            <div className="border-b border-border-subtle pb-4">
              <h2 className="text-xl font-bold text-text-primary">Assignment Details</h2>
              <p className="text-xs text-text-secondary mt-1">Basic information about your assignment</p>
            </div>

            {/* Custom inputs for Metadata (Title, Subject, Topic, Grade) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-primary">Assignment Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="e.g. Electric Current Quiz"
                  className="w-full px-4 py-2.5 bg-white border border-border-subtle rounded-xl text-sm placeholder-text-secondary focus:outline-none focus:border-brand"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-primary">Subject</label>
                <input 
                  type="text" 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value)} 
                  placeholder="e.g. Physics"
                  className="w-full px-4 py-2.5 bg-white border border-border-subtle rounded-xl text-sm placeholder-text-secondary focus:outline-none focus:border-brand"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-primary">Topic / Syllabus</label>
                <input 
                  type="text" 
                  value={topic} 
                  onChange={(e) => setTopic(e.target.value)} 
                  placeholder="e.g. Ohm's Law & Circuit Analysis"
                  className="w-full px-4 py-2.5 bg-white border border-border-subtle rounded-xl text-sm placeholder-text-secondary focus:outline-none focus:border-brand"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-primary">Grade / Class Level</label>
                <input 
                  type="text" 
                  value={gradeLevel} 
                  onChange={(e) => setGradeLevel(e.target.value)} 
                  placeholder="e.g. Grade 10"
                  className="w-full px-4 py-2.5 bg-white border border-border-subtle rounded-xl text-sm placeholder-text-secondary focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            {/* File Upload Area */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerBrowse}
              className={clsx(
                "border-2 border-dashed rounded-custom-lg p-6 md:p-8 flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-all duration-200 select-none",
                isDragOver ? "border-brand bg-brand-light" : "border-border-subtle hover:border-brand hover:bg-gray-50/50"
              )}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".pdf,.png,.jpg,.jpeg,.txt"
              />
              
              {uploadedFile ? (
                <div className="flex items-center gap-3 p-3 bg-brand-light border border-brand/20 rounded-xl max-w-full">
                  <FileText className="w-8 h-8 text-brand flex-shrink-0" />
                  <div className="flex flex-col text-left min-w-0">
                    <span className="text-xs font-bold text-text-primary truncate">{uploadedFile.name}</span>
                    <span className="text-[10px] text-text-secondary">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <button 
                    onClick={clearUploadedFile} 
                    className="p-1 rounded-full hover:bg-white text-text-secondary hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-gray-50 border border-border-subtle flex items-center justify-center text-text-secondary shadow-sm">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-text-primary">Choose a file or drag & drop it here</span>
                    <span className="text-[10px] text-text-secondary">PDF, JPEG, PNG, upto 10MB</span>
                  </div>
                  <button 
                    type="button"
                    className="mt-1 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-border-subtle text-xs font-bold text-text-primary rounded-lg transition-colors"
                  >
                    Browse Files
                  </button>
                </>
              )}
            </div>
            
            <p className="text-[10px] text-text-secondary text-center -mt-3 select-none">
              Upload images of your preferred document/image reference
            </p>

            {/* Due Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-primary">Due Date</label>
              <div className="relative">
                <input 
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-white border border-border-subtle rounded-xl text-sm placeholder-text-secondary focus:outline-none focus:border-brand appearance-none"
                />
                <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
              </div>
            </div>

            {/* Question Types List */}
            <div className="flex flex-col gap-4">
              <div className="hidden md:grid grid-cols-12 gap-4 text-xs font-bold text-text-secondary border-b border-border-subtle pb-2 select-none">
                <div className="col-span-7">Question Type</div>
                <div className="col-span-2 text-center">No. of Questions</div>
                <div className="col-span-3 text-center">Marks</div>
              </div>

              {rows.map((row) => (
                <div key={row.id} className="w-full">
                  {/* Mobile View: Card Layout */}
                  <div className="md:hidden bg-white border border-border-subtle rounded-2xl p-4 flex flex-col gap-3.5 relative shadow-sm">
                    {/* Card Header (Type & Close Button) */}
                    <div className="flex items-center justify-between gap-2">
                      <select
                        value={row.type}
                        onChange={(e) => updateRow(row.id, "type", e.target.value as QuestionType)}
                        className="w-full bg-white border border-border-subtle rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-brand"
                      >
                        <option value="mcq">Multiple Choice Questions</option>
                        <option value="short_answer">Short Questions</option>
                        <option value="long_answer">Diagram/Graph-Based Questions</option>
                        <option value="fill_blank">Numerical Problems</option>
                        <option value="true_false">True / False Questions</option>
                      </select>
                      <button
                        onClick={() => removeRow(row.id)}
                        className="flex-shrink-0 flex items-center justify-center p-2 rounded-full text-text-secondary hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer border border-border-subtle"
                        title="Remove Row"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Card Body (Double counter row inside gray card) */}
                    <div className="bg-[#f0f0f2]/60 rounded-xl p-3 grid grid-cols-2 gap-4">
                      {/* Left: No. of Questions */}
                      <div className="flex flex-col items-center gap-1.5">
                        <span className="text-[10px] font-bold text-text-secondary">No. of Questions</span>
                        <div className="flex items-center bg-white border border-border-subtle rounded-full px-2 py-0.5 w-full justify-between shadow-sm">
                          <button 
                            onClick={() => decrementCount(row.id)}
                            className="w-7 h-7 flex items-center justify-center text-text-secondary hover:text-text-primary font-bold text-xs select-none cursor-pointer"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold text-text-primary select-none">{row.count}</span>
                          <button 
                            onClick={() => incrementCount(row.id)}
                            className="w-7 h-7 flex items-center justify-center text-text-secondary hover:text-text-primary font-bold text-xs select-none cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Right: Marks */}
                      <div className="flex flex-col items-center gap-1.5">
                        <span className="text-[10px] font-bold text-text-secondary">Marks</span>
                        <div className="flex items-center bg-white border border-border-subtle rounded-full px-2 py-0.5 w-full justify-between shadow-sm">
                          <button 
                            onClick={() => decrementMarks(row.id)}
                            className="w-7 h-7 flex items-center justify-center text-text-secondary hover:text-text-primary font-bold text-xs select-none cursor-pointer"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold text-text-primary select-none">{row.marks}</span>
                          <button 
                            onClick={() => incrementMarks(row.id)}
                            className="w-7 h-7 flex items-center justify-center text-text-secondary hover:text-text-primary font-bold text-xs select-none cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Desktop View: Grid Layout */}
                  <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                    {/* Select Dropdown */}
                    <div className="col-span-7 flex items-center gap-2">
                      <button
                        onClick={() => removeRow(row.id)}
                        className="flex items-center justify-center p-1 rounded-md text-text-secondary hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
                        title="Remove Row"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <select
                        value={row.type}
                        onChange={(e) => updateRow(row.id, "type", e.target.value as QuestionType)}
                        className="w-full bg-white border border-border-subtle rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-brand"
                      >
                        <option value="mcq">Multiple Choice Questions</option>
                        <option value="short_answer">Short Questions</option>
                        <option value="long_answer">Diagram/Graph-Based Questions</option>
                        <option value="fill_blank">Numerical Problems</option>
                        <option value="true_false">True / False Questions</option>
                      </select>
                    </div>

                    {/* No. of Questions counter */}
                    <div className="col-span-2 flex items-center justify-center">
                      <div className="flex items-center bg-gray-50 border border-border-subtle rounded-full px-2.5 py-1">
                        <button 
                          onClick={() => decrementCount(row.id)}
                          className="w-5 h-5 flex items-center justify-center text-text-secondary hover:text-text-primary font-bold text-xs select-none cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-text-primary select-none">{row.count}</span>
                        <button 
                          onClick={() => incrementCount(row.id)}
                          className="w-5 h-5 flex items-center justify-center text-text-secondary hover:text-text-primary font-bold text-xs select-none cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Marks counter */}
                    <div className="col-span-3 flex items-center justify-center">
                      <div className="flex items-center bg-gray-50 border border-border-subtle rounded-full px-2.5 py-1">
                        <button 
                          onClick={() => decrementMarks(row.id)}
                          className="w-5 h-5 flex items-center justify-center text-text-secondary hover:text-text-primary font-bold text-xs select-none cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-text-primary select-none">{row.marks}</span>
                        <button 
                          onClick={() => incrementMarks(row.id)}
                          className="w-5 h-5 flex items-center justify-center text-text-secondary hover:text-text-primary font-bold text-xs select-none cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Question Button */}
              <button
                onClick={addRow}
                className="flex items-center gap-1.5 self-start text-xs font-bold text-text-primary hover:text-brand transition-colors mt-2 cursor-pointer"
              >
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-50 border border-border-subtle">
                  <Plus className="w-3 h-3" />
                </div>
                <span>Add Question Type</span>
              </button>
            </div>

            {/* Calculations Summary */}
            <div className="flex flex-col gap-1.5 items-end justify-end border-t border-border-subtle pt-4 text-xs font-bold text-text-secondary select-none">
              <div>
                <span>Total Questions : </span>
                <span className="text-text-primary text-sm pl-1">{totalQuestions}</span>
              </div>
              <div>
                <span>Total Marks : </span>
                <span className="text-text-primary text-sm pl-1">{totalMarks}</span>
              </div>
            </div>

            {/* Additional Information Voice/Text Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-primary">Additional Information (For better output)</label>
              <div className="relative">
                <textarea
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder="e.g. Generate a question paper for 3 hour exam duration..."
                  className="w-full px-4 py-3 bg-[#f8f8fa] border border-border-subtle rounded-custom-lg text-sm placeholder-text-secondary focus:outline-none focus:border-brand min-h-[90px] pr-10 resize-none"
                />
                <button
                  type="button"
                  title="Voice input"
                  className="absolute right-3.5 bottom-4 p-1.5 rounded-full hover:bg-gray-200 text-text-secondary active:scale-90 transition-all cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* Floating Bottom Nav bar with Previous & Next CTA */}
      <footer className="fixed bottom-0 left-0 lg:left-[260px] right-0 h-20 bg-white border-t border-border-subtle shadow-md px-6 py-4 flex items-center justify-between z-30 select-none">
        <button
          onClick={() => router.push("/")}
          className="flex items-center justify-center gap-2 px-5 py-3 hover:bg-gray-50 text-text-secondary font-bold text-xs rounded-full border border-border-subtle transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-[#111115] hover:bg-[#212128] text-white font-bold text-xs rounded-full shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>{isSubmitting ? "Submitting..." : "Next"}</span>
          {!isSubmitting && <ArrowRight className="w-3.5 h-3.5" />}
        </button>
      </footer>

      {/* Mobile Footer Sticky Navigation & CTA */}
      <MobileFooterNav />
    </div>
  );
}
