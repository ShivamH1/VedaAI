"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MobileFooterNav from "@/components/layout/MobileFooterNav";
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { clsx } from "clsx";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AssessmentGenerationProgress({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Connecting to VedaAI Generation Server...");

  const steps = [
    { threshold: 0, msg: "Connecting to VedaAI Generation Server..." },
    { threshold: 20, msg: "Analyzing uploaded material and syllabus..." },
    { threshold: 45, msg: "Generating Section A: Multiple Choice Questions..." },
    { threshold: 70, msg: "Generating Section B: Short Questions..." },
    { threshold: 90, msg: "Formulating Answer Keys & Guidelines..." },
    { threshold: 100, msg: "Assessment generation complete! Redirecting..." }
  ];

  useEffect(() => {
    const duration = 4000; // 4 seconds total
    const intervalTime = 80; // update progress every 80ms
    const totalSteps = duration / intervalTime;
    let stepCount = 0;

    const timer = setInterval(() => {
      stepCount++;
      const currentProgress = Math.min(Math.round((stepCount / totalSteps) * 100), 100);
      setProgress(currentProgress);

      // Update status message based on current progress threshold
      const matchedStep = [...steps].reverse().find(s => currentProgress >= s.threshold);
      if (matchedStep) {
        setStatusMessage(matchedStep.msg);
      }

      if (currentProgress >= 100) {
        clearInterval(timer);
        // Delay redirect slightly for premium feel
        setTimeout(() => {
          router.push(`/assessment/${id}/result`);
        }, 800);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [id, router]);

  return (
    <div className="flex min-h-screen bg-[#ececee] text-text-primary">
      {/* Sidebar - Laptop View */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 p-3 lg:pl-0 h-screen overflow-y-auto pb-24 lg:pb-3">
        {/* Laptop Header */}
        <div className="hidden lg:block mb-3">
          <Header title="Generating Assessment" />
        </div>

        {/* Loader Main Card */}
        <main className="flex-1 flex flex-col items-center justify-center bg-white rounded-custom-xl border border-border-subtle shadow-premium p-6 md:p-12 text-center min-h-[500px]">
          <div className="max-w-[480px] w-full flex flex-col items-center gap-6">
            
            {/* Spinning AI Sparkle Ring */}
            <div className="relative flex items-center justify-center w-24 h-24">
              <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
              <div 
                className="absolute inset-0 rounded-full border-4 border-brand border-t-transparent animate-spin" 
                style={{ animationDuration: "1.5s" }}
              />
              {progress < 100 ? (
                <Sparkles className="w-8 h-8 text-brand animate-pulse" />
              ) : (
                <CheckCircle2 className="w-10 h-10 text-emerald-500 animate-bounce" />
              )}
            </div>

            {/* Title / Description */}
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-bold text-text-primary tracking-tight select-none">
                {progress < 100 ? "AI is generating your question paper..." : "Generation Complete!"}
              </h2>
              <p className="text-xs text-text-secondary select-none">
                Do not close this page. The AI is formulating syllabus-compliant exam sheets.
              </p>
            </div>

            {/* Progress Bar & Indicators */}
            <div className="w-full flex flex-col gap-2.5 mt-2">
              <div className="flex justify-between items-center text-xs font-bold text-text-secondary select-none">
                <span className="text-brand transition-all duration-300">{statusMessage}</span>
                <span className="text-text-primary">{progress}%</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-brand-dark to-brand transition-all duration-100 ease-out" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Step list ticks indicator */}
            <div className="w-full flex flex-col gap-2.5 border-t border-border-subtle pt-6 mt-4 text-left">
              {[
                { label: "Queued Assessment Task", done: progress >= 20 },
                { label: "Analyzed Subject & Blueprint", done: progress >= 45 },
                { label: "Generated Question Formulations", done: progress >= 90 },
                { label: "Finalized Answer Keys & Scoring Rubrics", done: progress >= 100 },
              ].map((step, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs">
                  <div className={clsx(
                    "w-4 h-4 rounded-full flex items-center justify-center border transition-all duration-300",
                    step.done 
                      ? "bg-emerald-50 border-emerald-300 text-emerald-600" 
                      : "bg-white border-border-subtle text-text-secondary"
                  )}>
                    {step.done ? (
                      <span className="text-[10px] font-bold">✓</span>
                    ) : (
                      <span className="text-[8px] font-bold">{idx + 1}</span>
                    )}
                  </div>
                  <span className={clsx(
                    "font-medium",
                    step.done ? "text-text-primary" : "text-text-secondary"
                  )}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

          </div>
        </main>
      </div>

      {/* Mobile Footer */}
      <MobileFooterNav />
    </div>
  );
}
