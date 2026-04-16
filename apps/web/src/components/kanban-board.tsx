"use client";

import type { Candidate, CandidateState } from "@/types/entities";
import { CandidateCard } from "@/components/candidate-card";

const COLUMNS: { key: CandidateState; label: string }[] = [
  { key: "draft", label: "Draft" },
  { key: "under_review", label: "Under Review" },
  { key: "awaiting_response", label: "Awaiting Response" },
  { key: "ready", label: "Ready" },
  { key: "submitting", label: "Submitting" },
  { key: "committed", label: "Committed" },
];

interface KanbanBoardProps {
  candidates: Candidate[];
}

export function KanbanBoard({ candidates }: KanbanBoardProps) {
  const grouped = new Map<CandidateState, Candidate[]>();
  for (const col of COLUMNS) {
    grouped.set(col.key, []);
  }
  for (const c of candidates) {
    const list = grouped.get(c.state);
    if (list) list.push(c);
  }

  return (
    <div className="flex gap-4 overflow-x-auto p-6">
      {COLUMNS.map((col) => {
        const items = grouped.get(col.key) ?? [];
        return (
          <div
            key={col.key}
            className="flex min-w-[280px] shrink-0 flex-col rounded-lg bg-neutral-100 p-3"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="text-sm font-semibold text-neutral-700">
                {col.label}
              </span>
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-neutral-200 px-1.5 text-xs font-medium text-neutral-600">
                {items.length}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {items.map((candidate) => (
                <CandidateCard key={candidate.id} candidate={candidate} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
