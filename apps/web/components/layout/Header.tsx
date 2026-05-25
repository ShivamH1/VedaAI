"use client";

import { Bell, ArrowLeft, ChevronDown, RefreshCw, Trash } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useAssignmentStore } from "@/store/assignment.store";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
}

export default function Header({ title = "Assignment", showBack = false }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { assignments, clearAssignments, resetToMockData } = useAssignmentStore();

  const handleBack = () => {
    if (pathname === "/create") {
      router.push("/");
    } else {
      router.back();
    }
  };

  return (
    <header className="flex items-center justify-between w-full h-[64px] bg-white rounded-custom-xl border border-border-subtle shadow-premium px-6 py-3">
      {/* Breadcrumb section */}
      <div className="flex items-center gap-3">
        {(showBack || pathname !== "/") && (
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 border border-border-subtle transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-text-secondary" />
          </button>
        )}
        <div className="flex items-center gap-2">
          {/* Breadcrumb Grid Icon */}
          <div className="flex items-center justify-center w-5 h-5 text-text-secondary opacity-60">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          </div>
          <span className="text-sm font-semibold text-text-secondary select-none">{title}</span>
        </div>
      </div>

      {/* Action panel & profile */}
      <div className="flex items-center gap-4">
        {/* Quick Toggler for Demo evaluation */}
        <div className="flex items-center gap-1.5 border border-border-subtle bg-gray-50/50 rounded-full px-3 py-1 text-[11px] font-medium text-text-secondary select-none">
          <span className="mr-1">Demo State:</span>
          {assignments.length > 0 ? (
            <button
              onClick={clearAssignments}
              title="Switch to Empty State"
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 hover:bg-orange-100 text-brand transition-colors cursor-pointer"
            >
              <Trash className="w-2.5 h-2.5" />
              <span>Make Empty</span>
            </button>
          ) : (
            <button
              onClick={resetToMockData}
              title="Reset to Filled State"
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              <span>Load Mock Data</span>
            </button>
          )}
        </div>

        {/* Notification Bell */}
        <button className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-50 border border-border-subtle transition-colors cursor-pointer">
          <Bell className="w-4.5 h-4.5 text-text-secondary" />
          <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-brand border border-white" />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-border-subtle select-none cursor-pointer group">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-border-subtle bg-[#fff5f2] flex items-center justify-center">
            {/* User avatar SVG (matches John Doe icon) */}
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-brand">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 6C13.66 6 15 7.34 15 9C15 10.66 13.66 12 12 12C10.34 12 9 10.66 9 9C9 7.34 10.34 6 12 6ZM12 20.2C9.3 20.2 6.9 18.8 5.5 16.7C5.5 14.6 9.5 13.5 12 13.5C14.5 13.5 18.5 14.6 18.5 16.7C17.1 18.8 14.7 20.2 12 20.2Z" fill="currentColor"/>
            </svg>
          </div>
          <span className="hidden md:block text-xs font-semibold text-text-primary group-hover:text-brand transition-colors">John Doe</span>
          <ChevronDown className="w-3.5 h-3.5 text-text-secondary group-hover:text-brand transition-colors" />
        </div>
      </div>
    </header>
  );
}
