"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Building2, MoreVertical } from "lucide-react";

const navItems = [
  { href: "/candidates", label: "Candidates", icon: Users },
  { href: "/clients", label: "Clients", icon: Building2 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 flex-col border-r border-neutral-200 bg-white">
      {/* Brand */}
      <div className="px-5 pb-4 pt-5">
        <p className="text-sm font-bold text-neutral-900">ProService OCR</p>
        <p className="mt-0.5 text-xs text-neutral-400">Hawaii</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-violet-50 text-violet-700"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Profile */}
      <div className="flex items-center justify-between border-t border-neutral-200 px-5 py-4">
        <div>
          <p className="text-sm font-medium text-neutral-900">Avanish</p>
          <p className="text-xs text-neutral-400">HR Reviewer</p>
        </div>
        <button
          type="button"
          className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
