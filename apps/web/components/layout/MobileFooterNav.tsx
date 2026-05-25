"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Home, 
  FileText, 
  Library, 
  Wand2, 
  Plus 
} from "lucide-react";
import { clsx } from "clsx";

export default function MobileFooterNav() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { name: "Home", href: "/home", icon: Home },
    { name: "Assignments", href: "/", icon: FileText },
    { name: "Library", href: "/library", icon: Library },
    { name: "AI Toolkit", href: "/toolkit", icon: Wand2 },
  ];

  return (
    <>
      {/* Floating Action Button (Only visible on mobile/tablet) */}
      <div className="lg:hidden fixed bottom-24 right-6 z-50">
        <button
          onClick={() => router.push("/create")}
          className="flex items-center justify-center w-14 h-14 bg-white text-brand rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-border-subtle hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
          aria-label="Create Assignment"
        >
          <Plus className="w-7 h-7" strokeWidth={2.5} />
        </button>
      </div>

      {/* Sticky Bottom Nav Bar (Only visible on mobile/tablet) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-[#1e1e24] border-t border-gray-800 px-6 py-2 pb-5 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] flex items-center justify-between">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href === "/" && pathname === "/create");
          
          return (
            <Link
              key={item.name}
              href={item.href === "/" ? "/" : "#"} // Mock other links
              className="flex flex-col items-center gap-1 flex-1 py-1 transition-all"
            >
              <div className={clsx(
                "p-1.5 rounded-xl transition-colors duration-200",
                isActive ? "text-white" : "text-text-secondary"
              )}>
                <Icon className="w-5.5 h-5.5" />
              </div>
              <span className={clsx(
                "text-[10px] font-medium tracking-wide transition-colors duration-200",
                isActive ? "text-white" : "text-text-secondary"
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
