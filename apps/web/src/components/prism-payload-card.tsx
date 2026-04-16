"use client";

import { useEffect, useState } from "react";
import { FileJson, Copy, ChevronDown, Check } from "lucide-react";
import { getPrismPreview } from "@/lib/api";

const SECTION_KEYS = [
  "getClientCodes",
  "importEmployees",
  "commitEmployees",
  "updateW4",
  "updateDirectDeposit",
] as const;

interface PrismPayloadCardProps {
  candidateId: string;
}

export function PrismPayloadCard({ candidateId }: PrismPayloadCardProps) {
  const [payload, setPayload] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cardOpen, setCardOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const data = await getPrismPreview(candidateId);
        if (!cancelled) setPayload(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load payload");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [candidateId]);

  const toggleSection = (key: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleCopyAll = async () => {
    if (!payload) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: noop
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white">
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <FileJson className="h-4 w-4" />
            Loading Prism payload...
          </div>
        </div>
      </div>
    );
  }

  if (error || !payload) return null;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white">
      {/* Card header — click to expand/collapse */}
      <button
        onClick={() => setCardOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left"
      >
        <div className="flex items-center gap-2">
          <FileJson className="h-4 w-4 text-purple-600" />
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">
              PrismHR API Payload Preview
            </h3>
            <p className="text-xs text-neutral-500">
              The exact requests we would send to PrismHR
            </p>
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-neutral-400 transition-transform ${
            cardOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {cardOpen && (
        <div className="border-t border-neutral-100">
          {/* Copy All button */}
          <div className="flex justify-end px-4 pt-2 pb-1">
            <button
              onClick={handleCopyAll}
              className="inline-flex items-center gap-1.5 rounded border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-green-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copy All
                </>
              )}
            </button>
          </div>

          {/* Sections */}
          <div className="space-y-px px-3 pb-3">
            {SECTION_KEYS.map((key) => {
              const data = payload[key];
              const isOpen = openSections.has(key);
              const isNull = data === null;

              return (
                <div key={key} className="rounded border border-neutral-100">
                  <button
                    onClick={() => toggleSection(key)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-neutral-50"
                  >
                    <span className="text-xs font-mono font-medium text-neutral-700">
                      {key}
                    </span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-neutral-400 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="border-t border-neutral-100 px-3 py-2">
                      {isNull ? (
                        <p className="text-xs italic text-neutral-400">
                          Skipped — no bank info provided
                        </p>
                      ) : (
                        <pre className="overflow-x-auto rounded bg-neutral-50 p-3 text-xs leading-relaxed text-neutral-700 font-mono">
                          {JSON.stringify(data, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
