"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MobileFooterNav from "@/components/layout/MobileFooterNav";
import { useAssignmentStore } from "@/store/assignment.store";
import { 
  FileText, 
  Search, 
  SlidersHorizontal, 
  Plus, 
  MoreVertical, 
  Eye, 
  Trash2, 
  Menu, 
  Bell 
} from "lucide-react";
import { clsx } from "clsx";

export default function Dashboard() {
  const router = useRouter();
  const { assignments, deleteAssignment } = useAssignmentStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filter assignments based on search query
  const filteredAssignments = assignments.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleDropdown = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveDropdownId(activeDropdownId === id ? null : id);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteAssignment(id);
    setActiveDropdownId(null);
  };

  return (
    <div className="flex min-h-screen bg-[#ececee] text-text-primary">
      {/* Sidebar - Laptop View */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 p-3 lg:pl-0 h-screen overflow-y-auto pb-24 lg:pb-3">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between w-full h-[64px] bg-white rounded-custom-xl border border-border-subtle px-4 py-3 mb-3 shadow-premium">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-dark to-brand">
              <span className="text-white font-bold text-base leading-none">V</span>
            </div>
            <span className="text-lg font-bold tracking-tight">VedaAI</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button className="relative flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-50 border border-border-subtle">
              <Bell className="w-4 h-4 text-text-secondary" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand" />
            </button>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-border-subtle bg-[#fff5f2] flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-brand">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 6C13.66 6 15 7.34 15 9C15 10.66 13.66 12 12 12C10.34 12 9 10.66 9 9C9 7.34 10.34 6 12 6ZM12 20.2C9.3 20.2 6.9 18.8 5.5 16.7C5.5 14.6 9.5 13.5 12 13.5C14.5 13.5 18.5 14.6 18.5 16.7C17.1 18.8 14.7 20.2 12 20.2Z" fill="currentColor"/>
              </svg>
            </div>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-50 border border-border-subtle"
            >
              <Menu className="w-4 h-4 text-text-secondary" />
            </button>
          </div>
        </header>

        {/* Laptop Header */}
        <div className="hidden lg:block mb-3">
          <Header title="Assignment" />
        </div>

        {/* Dynamic State Layout */}
        <main className="flex-1 flex flex-col min-w-0" onClick={() => setActiveDropdownId(null)}>
          {assignments.length === 0 ? (
            /* ========================================== */
            /*              1. EMPTY STATE                */
            /* ========================================== */
            <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-custom-xl border border-border-subtle shadow-premium p-6 md:p-12 text-center min-h-[500px]">
              {/* Premium Vector Illustration */}
              <div className="relative w-[280px] h-[220px] md:w-[340px] md:h-[260px] mb-8 select-none">
                {/* Loop Decorator */}
                <svg className="absolute -left-4 top-10 w-24 h-24 text-gray-300 opacity-60" viewBox="0 0 100 100" fill="none">
                  <path d="M10 50 C 20 20, 60 10, 50 50 C 40 90, 80 80, 90 50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                </svg>

                {/* Stars and dots Decorator */}
                <div className="absolute left-10 bottom-6 text-[#2a4e6c] opacity-75">
                  <svg className="w-6 h-6 animate-pulse" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="absolute right-8 top-16 w-3 h-3 rounded-full bg-[#346294] opacity-80" />

                {/* Main empty card and magnifier graphics */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative bg-gray-50 border border-gray-200 rounded-2xl w-[120px] h-[160px] shadow-sm p-3 flex flex-col gap-2">
                    <div className="w-8 h-2 bg-gray-700 rounded-full" />
                    <div className="w-14 h-1.5 bg-gray-300 rounded-full" />
                    <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
                    <div className="w-16 h-1.5 bg-gray-300 rounded-full" />
                    
                    {/* Circle and X overlap representing search failure */}
                    <div className="absolute -bottom-2 -right-10 w-28 h-28 bg-[#ededf3] rounded-full border border-white shadow-md flex items-center justify-center">
                      <div className="relative w-20 h-20 bg-white rounded-full shadow-inner flex items-center justify-center border border-gray-100">
                        {/* Red X Circle */}
                        <div className="w-10 h-10 rounded-full bg-[#fceceb] flex items-center justify-center border border-[#fad4d1] shadow-sm">
                          <span className="text-[#ea4335] text-xl font-bold">✕</span>
                        </div>
                        {/* Magnifier stick */}
                        <div className="absolute bottom-1 right-1 w-8 h-2.5 bg-[#e0dfeb] rounded-full rotate-45 origin-bottom-right shadow-sm border border-white" />
                      </div>
                    </div>
                    
                    {/* Tiny badge */}
                    <div className="absolute -top-3 -right-6 w-12 h-8 bg-white border border-gray-100 rounded-lg shadow-sm p-1.5 flex flex-col gap-1 justify-center">
                      <div className="w-3 h-1 bg-gray-300 rounded-full" />
                      <div className="w-5 h-1 bg-gray-300 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Text Description */}
              <h2 className="text-2xl font-bold text-text-primary mb-3">No assignments yet</h2>
              <p className="max-w-[520px] text-sm text-text-secondary leading-relaxed mb-8">
                Create your first assignment to start collecting and grading student submissions. You can set up rubrics, define marking criteria, and let AI assist with grading.
              </p>

              {/* Action Button */}
              <button
                onClick={() => router.push("/create")}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-[#111115] hover:bg-[#212128] text-white font-bold rounded-full shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-95 transition-all cursor-pointer text-sm"
              >
                <Plus className="w-4.5 h-4.5" strokeWidth={2.5} />
                <span>Create Your First Assignment</span>
              </button>
            </div>
          ) : (
            /* ========================================== */
            /*              2. FILLED STATE               */
            /* ========================================== */
            <div className="flex-1 flex flex-col bg-white rounded-custom-xl border border-border-subtle shadow-premium p-4 md:p-6 min-h-[500px]">
              {/* Section Header */}
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse border border-white shadow-sm" />
                <div>
                  <h2 className="text-xl font-bold text-text-primary leading-none">Assignments</h2>
                  <span className="text-xs text-text-secondary">Manage and create assignments for your classes.</span>
                </div>
              </div>

              {/* Filter and Search controls */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mt-4 mb-6">
                <button className="flex items-center gap-2 w-full sm:w-auto px-4 py-2.5 bg-white border border-border-subtle rounded-full text-sm font-semibold text-text-secondary hover:bg-gray-50 active:scale-95 transition-all select-none cursor-pointer">
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Filter By</span>
                </button>

                <div className="relative w-full sm:w-[320px]">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Assignment"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-border-subtle rounded-full text-sm placeholder-text-secondary focus:outline-none focus:border-brand transition-colors shadow-sm"
                  />
                </div>
              </div>

              {/* Grid Layout of Assignment Cards */}
              {filteredAssignments.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                  <span className="text-text-secondary text-sm">No assignments matches your search query.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="relative bg-white border border-border-subtle rounded-custom-lg shadow-premium p-6 shadow-card-hover border-l-4 border-l-brand flex flex-col justify-between min-h-[170px]"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex flex-col gap-1 min-w-0">
                          <h3 className="text-base font-bold text-text-primary tracking-tight truncate select-all cursor-pointer hover:text-brand transition-colors">
                            {assignment.title}
                          </h3>
                          <span className="text-xs text-text-secondary">
                            {assignment.subject} • {assignment.topic}
                          </span>
                        </div>

                        {/* Dropdown Menu button */}
                        <div className="relative">
                          <button
                            onClick={(e) => toggleDropdown(assignment.id, e)}
                            className="p-1.5 rounded-full hover:bg-gray-100 text-text-secondary transition-colors cursor-pointer"
                          >
                            <MoreVertical className="w-4.5 h-4.5" />
                          </button>

                          {activeDropdownId === assignment.id && (
                            <div className="absolute right-0 mt-1.5 w-40 bg-white border border-border-subtle rounded-xl shadow-lg py-1.5 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
                              <button
                                onClick={() => router.push(`/assessment/${assignment.id}`)}
                                className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-gray-50 transition-colors text-left cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View Assignment</span>
                              </button>
                              <button
                                onClick={(e) => handleDelete(assignment.id, e)}
                                className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors text-left cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Footer info */}
                      <div className="flex items-center justify-between border-t border-border-subtle pt-4 mt-6 text-xs text-text-secondary">
                        <div>
                          <span className="font-medium text-text-secondary/70">Assigned on: </span>
                          <span className="font-bold text-text-primary">{assignment.assignedDate}</span>
                        </div>
                        <div>
                          <span className="font-medium text-text-secondary/70">Due: </span>
                          <span className="font-bold text-text-primary">{assignment.dueDate}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Bottom Sticky "+ Create Assignment" pill button */}
              <div className="flex justify-center mt-12 mb-4">
                <button
                  onClick={() => router.push("/create")}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[#111115] hover:bg-[#212128] text-white font-bold rounded-full shadow-lg hover:scale-[1.01] active:scale-95 transition-all cursor-pointer text-sm"
                >
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                  <span>Create Assignment</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Footer Sticky Navigation & CTA */}
      <MobileFooterNav />
    </div>
  );
}
