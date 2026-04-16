"use client";

import { useEffect, useState } from "react";
import { Mail, Copy, Download, X, Loader2 } from "lucide-react";
import { draftEmail } from "@/lib/api";
import type { Form, Field, FormType } from "@/types/entities";

interface AnalysisBundle {
  forms: Form[];
  prism_codes: Record<string, string | null>;
  reconciliation: Record<string, unknown>;
  warnings: string[];
  candidate_state: string;
}

interface EmailDraftModalProps {
  open: boolean;
  onClose: () => void;
  candidateId: string;
  candidateName: string;
  bundle: AnalysisBundle | null;
}

const FORM_TYPE_LABELS: Record<string, string> = {
  EMPLOYMENT_FORM: "Employment Form",
  W4: "Form W-4",
  I9_SEC1: "Form I-9 Section 1",
  I9_SEC2: "Form I-9 Section 2",
  HW4: "Form HW-4 (Hawaii)",
  HC5: "Health Care Waiver (HC-5)",
  DIRECT_DEPOSIT: "Direct Deposit Authorization",
  HANDBOOK_ACK: "Employee Handbook Acknowledgement",
  EMPLOYMENT_AGREEMENT: "Employment Agreement",
  HW4_WORKSHEET: "HW-4 Worksheet",
};

function humanizeFormType(type: FormType | string): string {
  return FORM_TYPE_LABELS[type] ?? type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function humanizeFieldName(name: string): string {
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const STATUS_REASONS: Record<string, string> = {
  red: "Missing or low confidence",
  orange: "Format invalid",
  yellow: "Cross-form conflict",
};

function collectIssues(bundle: AnalysisBundle): Array<{ field: string; form: string; reason: string }> {
  const issues: Array<{ field: string; form: string; reason: string }> = [];
  for (const form of bundle.forms) {
    for (const field of form.extracted_fields) {
      if (field.status === "red" || field.status === "orange" || field.status === "yellow") {
        issues.push({
          field: humanizeFieldName(field.name),
          form: humanizeFormType(form.type),
          reason: STATUS_REASONS[field.status] ?? field.status,
        });
      }
    }
  }
  return issues;
}

export function EmailDraftModal({ open, onClose, candidateId, candidateName, bundle }: EmailDraftModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !bundle) return;

    let cancelled = false;

    async function generate() {
      setLoading(true);
      setError(null);
      setCopied(false);

      try {
        const issues = collectIssues(bundle!);
        const result = await draftEmail(candidateId, {
          candidate_name: candidateName,
          issues,
        });
        if (cancelled) return;
        setTo(result.to);
        setSubject(result.subject);
        setBody(result.body);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to generate email draft");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    generate();

    return () => {
      cancelled = true;
    };
  }, [open, bundle, candidateId, candidateName]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setTo("");
      setSubject("");
      setBody("");
      setError(null);
      setLoading(false);
      setCopied(false);
    }
  }, [open]);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: won't work in all contexts but worth trying
      console.error("Clipboard write failed");
    }
  };

  const handleDownloadEml = () => {
    const eml = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/plain; charset=UTF-8`,
      ``,
      body,
    ].join("\r\n");

    const blob = new Blob([eml], { type: "message/rfc822" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clarification-${candidateName.replace(/\s+/g, "-").toLowerCase()}.eml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-neutral-900">
              Draft Clarification Email
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            <p className="mt-4 text-sm text-neutral-500">
              Generating email draft with AI...
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              This usually takes 10-15 seconds
            </p>
          </div>
        ) : error ? (
          <div className="py-8">
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* To field */}
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                To
              </label>
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Subject field */}
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Body field */}
            <div className="mb-5">
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                Body
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
              >
                Close
              </button>
              <button
                onClick={handleDownloadEml}
                className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
              >
                <Download className="h-4 w-4" />
                Download .eml
              </button>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700"
              >
                <Copy className="h-4 w-4" />
                {copied ? "Copied!" : "Copy to Clipboard"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
