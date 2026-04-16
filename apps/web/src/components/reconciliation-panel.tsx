"use client";

import { useState } from "react";
import { AlertTriangle, Check } from "lucide-react";

interface Variant {
  value: string;
  source_form: string;
}

interface ReconciliationEntry {
  chosen: string | null;
  conflict: boolean;
  variants: Variant[];
}

interface ReconciliationPanelProps {
  reconciliation: Record<string, ReconciliationEntry>;
  onConfirm?: (canonicalKey: string, chosenValue: string) => void;
}

function humanizeKey(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const NOT_SURE = "__not_sure__";

export function ReconciliationPanel({ reconciliation, onConfirm }: ReconciliationPanelProps) {
  const conflicts = Object.entries(reconciliation).filter(([, entry]) => entry.conflict);
  const [selections, setSelections] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const [key, entry] of conflicts) {
      if (entry.chosen != null) {
        initial[key] = entry.chosen;
      }
    }
    return initial;
  });
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  const [notSureKeys, setNotSureKeys] = useState<Set<string>>(new Set());

  if (conflicts.length === 0) return null;

  return (
    <div className="rounded-lg border border-orange-200 bg-white">
      <div className="flex items-center gap-2 border-b border-orange-100 px-4 py-2.5">
        <AlertTriangle className="h-4 w-4 text-orange-500" />
        <h3 className="text-sm font-semibold text-neutral-900">Reconciliation</h3>
        <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
          {conflicts.length} conflict{conflicts.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="divide-y divide-neutral-100 px-4">
        {conflicts.map(([key, entry]) => {
          const isNotSure = notSureKeys.has(key);
          const isConfirmed = confirmed.has(key);
          const borderClass = isConfirmed && isNotSure
            ? "rounded-lg border-2 border-amber-400 bg-amber-50 py-3 px-3"
            : "py-3";

          return (
            <div key={key} className={borderClass}>
              <p className="mb-2 text-sm font-medium text-neutral-700">{humanizeKey(key)}</p>
              <div className="space-y-1.5">
                {entry.variants.map((variant, idx) => (
                  <label
                    key={idx}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-neutral-50"
                  >
                    <input
                      type="radio"
                      name={`recon-${key}`}
                      value={variant.value}
                      checked={selections[key] === variant.value}
                      onChange={() =>
                        setSelections((prev) => ({ ...prev, [key]: variant.value }))
                      }
                      disabled={isConfirmed}
                      className="h-4 w-4 border-neutral-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-neutral-900">{variant.value}</span>
                    <span className="text-xs text-neutral-400">({variant.source_form})</span>
                  </label>
                ))}
                {/* Not Sure option */}
                <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-amber-50">
                  <input
                    type="radio"
                    name={`recon-${key}`}
                    value={NOT_SURE}
                    checked={selections[key] === NOT_SURE}
                    onChange={() =>
                      setSelections((prev) => ({ ...prev, [key]: NOT_SURE }))
                    }
                    disabled={isConfirmed}
                    className="h-4 w-4 border-neutral-300 text-amber-500 focus:ring-amber-400"
                  />
                  <span className="text-sm text-amber-700">Not Sure &mdash; flag for clarification</span>
                </label>
              </div>
              {isConfirmed && isNotSure && (
                <p className="mt-2 text-sm text-amber-700 font-medium">Flagged for clarification</p>
              )}
              <button
                onClick={() => {
                  const chosen = selections[key];
                  if (!chosen) return;
                  setConfirmed((prev) => new Set(prev).add(key));
                  if (chosen === NOT_SURE) {
                    setNotSureKeys((prev) => new Set(prev).add(key));
                  }
                  onConfirm?.(key, chosen);
                }}
                disabled={!selections[key] || isConfirmed}
                className={
                  isConfirmed && isNotSure
                    ? "mt-2 inline-flex items-center gap-1 rounded bg-amber-500 px-3 py-1 text-xs font-medium text-white cursor-default"
                    : "mt-2 inline-flex items-center gap-1 rounded bg-purple-600 px-3 py-1 text-xs font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-40"
                }
              >
                {isConfirmed ? (
                  <>
                    <Check className="h-3 w-3" /> {isNotSure ? "Flagged" : "Confirmed"}
                  </>
                ) : (
                  "Confirm Selection"
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
