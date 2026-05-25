"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAssignmentStore } from "@/store/assignment.store";
import { 
  Home, 
  Users, 
  FileText, 
  Wand2, 
  Library, 
  Settings, 
  Sparkles 
} from "lucide-react";
import { clsx } from "clsx";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const assignments = useAssignmentStore((state) => state.assignments);
  const activeCount = assignments.length;

  const menuItems = [
    { name: "Home", href: "/home", icon: Home },
    { name: "My Groups", href: "/groups", icon: Users },
    { name: "Assignments", href: "/", icon: FileText, badge: activeCount },
    { name: "AI Teacher's Toolkit", href: "/toolkit", icon: Wand2 },
    { name: "My Library", href: "/library", icon: Library },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-[260px] h-[calc(100vh-24px)] my-3 ml-3 bg-white rounded-custom-xl border border-border-subtle shadow-premium p-5 justify-between">
      <div className="flex flex-col gap-6">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 px-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-dark to-brand shadow-md">
            <span className="text-white font-bold text-xl leading-none">V</span>
          </div>
          <span className="text-xl font-bold text-text-primary tracking-tight">VedaAI</span>
        </Link>

        {/* Create Assignment Button */}
        <button
          onClick={() => router.push("/create")}
          className="relative flex items-center justify-center gap-2 w-full py-3.5 bg-[#1e1e24] hover:bg-[#2e2e36] text-white font-semibold rounded-full shadow-lg border-2 border-brand/80 transition-all duration-300 group overflow-hidden cursor-pointer"
        >
          <div className="absolute inset-0 bg-brand opacity-0 group-hover:opacity-10 transition-opacity" />
          <Sparkles className="w-4 h-4 text-brand group-hover:scale-110 transition-transform duration-300" />
          <span className="text-sm">Create Assignment</span>
        </button>

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-1.5 mt-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            // The root path '/' serves as assignments dashboard in this layout
            const isActive = pathname === item.href || (item.href === "/" && pathname === "/create");
            
            return (
              <Link
                key={item.name}
                href={item.href === "/" ? "/" : "#"} // Mock other links
                className={clsx(
                  "flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium",
                  isActive
                    ? "bg-[#f4f4f6] text-text-primary"
                    : "text-text-secondary hover:bg-gray-50 hover:text-text-primary"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={clsx(
                    "w-4 h-4 transition-transform group-hover:scale-105",
                    isActive ? "text-brand" : "text-text-secondary group-hover:text-text-primary"
                  )} />
                  <span>{item.name}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={clsx(
                    "px-2 py-0.5 text-xs font-bold rounded-full transition-all duration-200",
                    isActive 
                      ? "bg-brand text-white" 
                      : "bg-[#fff0eb] text-brand"
                  )}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="flex flex-col gap-4">
        <Link
          href="#"
          className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-gray-50 rounded-xl transition-all duration-200 group"
        >
          <Settings className="w-4 h-4 text-text-secondary group-hover:text-text-primary group-hover:rotate-45 transition-transform duration-300" />
          <span>Settings</span>
        </Link>

        {/* Profile Card */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-custom-lg border border-gray-100">
          <div className="w-10 h-10 rounded-full bg-brand-light border border-brand/20 overflow-hidden flex items-center justify-center">
            {/* Monkey avatar representation in vector format */}
            <svg className="w-7 h-7 text-brand" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 6C13.66 6 15 7.34 15 9C15 10.66 13.66 12 12 12C10.34 12 9 10.66 9 9C9 7.34 10.34 6 12 6ZM12 20.2C9.3 20.2 6.9 18.8 5.5 16.7C5.5 14.6 9.5 13.5 12 13.5C14.5 13.5 18.5 14.6 18.5 16.7C17.1 18.8 14.7 20.2 12 20.2Z" fill="currentColor"/>
            </svg>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-text-primary truncate">Delhi Public School</span>
            <span className="text-[10px] text-text-secondary truncate">Bokaro Steel City</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
