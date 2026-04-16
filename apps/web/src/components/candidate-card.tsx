"use client";

import Link from "next/link";
import type { Candidate } from "@/types/entities";
import { StatusBadge } from "@/components/status-badge";

function timeAgo(date: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000,
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface CandidateCardProps {
  candidate: Candidate;
}

export function CandidateCard({ candidate }: CandidateCardProps) {
  const name =
    candidate.canonical_employee?.legal_name ??
    candidate.canonical_employee?.first_name ??
    candidate.id;

  return (
    <Link href={`/candidates/${candidate.id}`}>
      <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
        <p className="text-sm font-semibold text-neutral-900">{name}</p>
        <p className="mt-0.5 text-xs text-neutral-500">
          Jordan&apos;s Surf Shack
        </p>
        <div className="mt-2 flex items-center gap-2">
          <StatusBadge state={candidate.state} />
          <span className="text-xs text-neutral-400">
            {timeAgo(candidate.updated_at)}
          </span>
        </div>
      </div>
    </Link>
  );
}
