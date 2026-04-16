"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/topbar";
import { KanbanBoard } from "@/components/kanban-board";
import { UploadDialog } from "@/components/upload-dialog";
import { listCandidates } from "@/lib/api";
import type { Candidate } from "@/types/entities";

export default function CandidatesPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    listCandidates()
      .then(setCandidates)
      .catch(() => {
        /* TODO: error state */
      });
  }, []);

  return (
    <div className="flex h-full flex-col">
      <Topbar
        title="Candidates"
        action={
          <button
            onClick={() => setShowUpload(true)}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700"
          >
            + New Packet
          </button>
        }
      />
      <div className="flex-1 overflow-hidden">
        <KanbanBoard candidates={candidates} />
      </div>
      <UploadDialog
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onComplete={(id) => router.push(`/candidates/${id}`)}
      />
    </div>
  );
}
