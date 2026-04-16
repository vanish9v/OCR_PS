"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, Check, Loader2, Circle, X, ChevronDown } from "lucide-react";
import { uploadPacket, analyzeCandidate, listClients } from "@/lib/api";
import type { Client } from "@/types/entities";

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  onComplete: (candidateId: string) => void;
}

type Stage = {
  label: string;
  status: "pending" | "in-progress" | "completed";
};

const INITIAL_STAGES: Stage[] = [
  { label: "Classifying pages...", status: "pending" },
  { label: "Extracting fields...", status: "pending" },
  { label: "Validating data...", status: "pending" },
  { label: "Mapping to PrismHR codes...", status: "pending" },
  { label: "Cross-checking forms...", status: "pending" },
];

export function UploadDialog({ open, onClose, onComplete }: UploadDialogProps) {
  const [mode, setMode] = useState<"upload" | "analyzing">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [stages, setStages] = useState<Stage[]>(INITIAL_STAGES);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stageIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch clients when dialog opens
  useEffect(() => {
    if (open) {
      listClients()
        .then((data) => {
          setClients(data);
          if (data.length > 0 && !clientId) {
            setClientId(data[0].id);
          }
        })
        .catch(() => {
          /* TODO: error handling */
        });
    }
  }, [open, clientId]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setMode("upload");
      setFile(null);
      setStages(INITIAL_STAGES);
      setAnalysisDone(false);
      if (stageIntervalRef.current) {
        clearInterval(stageIntervalRef.current);
        stageIntervalRef.current = null;
      }
    }
  }, [open]);

  // Animate stages during analysis
  useEffect(() => {
    if (mode !== "analyzing" || analysisDone) return;

    let currentStage = 0;
    // Set first stage to in-progress immediately
    setStages((prev) =>
      prev.map((s, i) => (i === 0 ? { ...s, status: "in-progress" } : s))
    );

    stageIntervalRef.current = setInterval(() => {
      currentStage++;
      setStages((prev) => {
        if (currentStage >= prev.length) {
          // All stages cycled through; stop advancing
          if (stageIntervalRef.current) {
            clearInterval(stageIntervalRef.current);
            stageIntervalRef.current = null;
          }
          return prev;
        }
        return prev.map((s, i) => {
          if (i < currentStage) return { ...s, status: "completed" };
          if (i === currentStage) return { ...s, status: "in-progress" };
          return { ...s, status: "pending" };
        });
      });
    }, 2000);

    return () => {
      if (stageIntervalRef.current) {
        clearInterval(stageIntervalRef.current);
        stageIntervalRef.current = null;
      }
    };
  }, [mode, analysisDone]);

  const handleFileSelect = useCallback((f: File) => {
    if (f.type === "application/pdf") {
      setFile(f);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFileSelect(f);
    },
    [handleFileSelect]
  );

  const handleSubmit = async () => {
    if (!file || !clientId) return;

    setMode("analyzing");

    try {
      const uploadResult = await uploadPacket(file, clientId);
      const candidateId = uploadResult.candidate_id;

      await analyzeCandidate(candidateId);

      // Mark all stages complete
      setAnalysisDone(true);
      if (stageIntervalRef.current) {
        clearInterval(stageIntervalRef.current);
        stageIntervalRef.current = null;
      }
      setStages((prev) => prev.map((s) => ({ ...s, status: "completed" })));

      // Brief delay so user sees all-green before navigating
      setTimeout(() => {
        onComplete(candidateId);
      }, 600);
    } catch (err) {
      console.error("Analyze failed:", err);
      setError(err instanceof Error ? err.message : "Analysis failed. Check console.");
      setMode("upload");
      setStages(INITIAL_STAGES);
      setAnalysisDone(false);
    }
  };

  if (!open) return null;

  const progressPercent =
    (stages.filter((s) => s.status === "completed").length / stages.length) *
    100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget && mode === "upload") onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        {mode === "upload" ? (
          <>
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">
                Upload New Hire Packet
              </h2>
              <button
                onClick={onClose}
                className="rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Drop zone */}
            <div
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 transition-colors ${
                dragOver
                  ? "border-purple-400 bg-purple-50"
                  : file
                    ? "border-green-300 bg-green-50"
                    : "border-neutral-300 bg-neutral-50 hover:border-neutral-400"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                }}
              />
              <Upload
                className={`mb-3 h-10 w-10 ${file ? "text-green-500" : "text-neutral-400"}`}
              />
              {file ? (
                <p className="text-sm font-medium text-green-700">
                  {file.name}
                </p>
              ) : (
                <>
                  <p className="text-sm font-medium text-neutral-700">
                    Drop PDF here or click to browse
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Supports PDF files up to 25MB
                  </p>
                </>
              )}
            </div>

            {/* Client dropdown */}
            <div className="mt-5">
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                Client
              </label>
              <div className="relative">
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-neutral-300 bg-white py-2 pl-3 pr-10 text-sm text-neutral-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!file || !clientId}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Upload &amp; Analyze
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Analyzing state */}
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-neutral-900">
                Analyzing Packet...
              </h2>
            </div>

            {/* Progress bar */}
            <div className="mb-6 h-2 overflow-hidden rounded-full bg-neutral-200">
              <div
                className="h-full rounded-full bg-purple-600 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Stage checklist */}
            <div className="space-y-3">
              {stages.map((stage, i) => (
                <div key={i} className="flex items-center gap-3">
                  {stage.status === "completed" ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  ) : stage.status === "in-progress" ? (
                    <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-neutral-300" />
                  )}
                  <span
                    className={`text-sm ${
                      stage.status === "completed"
                        ? "text-neutral-600"
                        : stage.status === "in-progress"
                          ? "font-medium text-purple-600"
                          : "text-neutral-400"
                    }`}
                  >
                    {stage.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom note */}
            <p className="mt-6 text-center text-xs text-neutral-400">
              This usually takes 10-15 seconds
            </p>
          </>
        )}
      </div>
    </div>
  );
}
