"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Loader2 } from "lucide-react";
import { getCandidate, analyzeCandidate, getClient, updateCandidateState, saveBundle } from "@/lib/api";
import { StatusBadge } from "@/components/status-badge";
import { PageViewer } from "@/components/page-viewer";
import { PrismCodesCard } from "@/components/prism-codes-card";
import { PrismPayloadCard } from "@/components/prism-payload-card";
import { ReconciliationPanel } from "@/components/reconciliation-panel";
import { FormSection } from "@/components/form-section";
import { EmailDraftModal } from "@/components/email-draft-modal";
import type { Candidate, Packet, Form, CandidateState } from "@/types/entities";

interface AnalysisBundle {
  forms: Form[];
  prism_codes: Record<string, string | null>;
  reconciliation: Record<string, { chosen: string | null; conflict: boolean; variants: { value: string; source_form: string }[] }>;
  warnings: string[];
  candidate_state: CandidateState;
}

export default function CandidateReviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [clientName, setClientName] = useState<string>("");
  const [bundle, setBundle] = useState<AnalysisBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Total pages across all packets (we use the first packet for the viewer)
  const totalPages = packets.length > 0 ? packets[0].page_image_paths.length : 0;
  const activePacketId = packets.length > 0 ? packets[0].id : "";

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getCandidate(id);
        setCandidate(data);
        setPackets(data.packets ?? []);

        // If a stored analyze bundle exists, use it immediately
        if (data.analyze_bundle) {
          setBundle(data.analyze_bundle as AnalysisBundle);
        }

        // Fetch client name
        try {
          const client = await getClient(data.client_id);
          setClientName(client.name);
        } catch {
          setClientName(data.client_id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load candidate");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleAnalyze = useCallback(async () => {
    try {
      setAnalyzing(true);
      const result = await analyzeCandidate(id);
      setBundle(result as AnalysisBundle);
      setCandidate((prev) =>
        prev ? { ...prev, state: result.candidate_state ?? "under_review" } : prev,
      );
      setCurrentPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }, [id]);

  const handleStateChange = useCallback(
    async (newState: string) => {
      try {
        const updated = await updateCandidateState(id, newState);
        setCandidate((prev) => (prev ? { ...prev, state: updated.state } : prev));
      } catch (err) {
        setError(err instanceof Error ? err.message : "State update failed");
      }
    },
    [id],
  );

  const handleReconciliationConfirm = useCallback(
    (canonicalKey: string, chosenValue: string) => {
      if (!bundle) return;

      // If "Not Sure", skip propagation — just mark visually
      if (chosenValue === "__not_sure__") {
        const updatedRecon = { ...bundle.reconciliation };
        if (updatedRecon[canonicalKey]) {
          updatedRecon[canonicalKey] = {
            ...updatedRecon[canonicalKey],
            chosen: "__not_sure__",
          };
        }
        const notSureBundle = { ...bundle, reconciliation: updatedRecon };
        setBundle(notSureBundle);
        saveBundle(id, notSureBundle).catch(console.error);
        return;
      }

      // Propagate chosen value to ALL matching form fields
      const updatedForms = bundle.forms.map((form) => ({
        ...form,
        extracted_fields: form.extracted_fields.map((field) =>
          field.canonical_key === canonicalKey
            ? { ...field, value: chosenValue, status: "green" as const }
            : field,
        ),
      }));

      // Mark reconciliation entry as resolved
      const updatedRecon = { ...bundle.reconciliation };
      if (updatedRecon[canonicalKey]) {
        updatedRecon[canonicalKey] = {
          ...updatedRecon[canonicalKey],
          conflict: false,
          chosen: chosenValue,
        };
      }

      const updatedBundle = {
        ...bundle,
        forms: updatedForms,
        reconciliation: updatedRecon,
      };
      setBundle(updatedBundle);

      // Persist updated bundle to backend
      saveBundle(id, updatedBundle).catch(console.error);
    },
    [bundle, id],
  );

  const candidateName =
    candidate?.canonical_employee?.legal_name ??
    candidate?.canonical_employee?.first_name ??
    "Unknown Candidate";

  // --- Loading state ---
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  // --- Error state ---
  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={() => router.push("/candidates")}
          className="text-sm text-purple-600 underline"
        >
          Back to Candidates
        </button>
      </div>
    );
  }

  // --- Draft state: show Analyze CTA ---
  if (candidate?.state === "draft" && !bundle) {
    return (
      <div className="flex h-full flex-col">
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/candidates")}
              className="rounded p-1 hover:bg-neutral-100"
            >
              <ArrowLeft className="h-5 w-5 text-neutral-500" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-neutral-900">{candidateName}</h1>
              <p className="text-sm text-neutral-500">{clientName}</p>
            </div>
            <StatusBadge state={candidate.state} />
          </div>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <p className="text-neutral-500">
            This packet has been uploaded but not yet analyzed.
          </p>
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:opacity-60"
          >
            {analyzing && <Loader2 className="h-4 w-4 animate-spin" />}
            {analyzing ? "Analyzing..." : "Analyze Packet"}
          </button>
        </div>
      </div>
    );
  }

  // --- Full review layout ---
  return (
    <div className="flex h-full flex-col">
      {/* Header bar */}
      <header className="flex shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/candidates")}
            className="rounded p-1 hover:bg-neutral-100"
          >
            <ArrowLeft className="h-5 w-5 text-neutral-500" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-neutral-900">{candidateName}</h1>
            <p className="text-sm text-neutral-500">{clientName}</p>
          </div>
          <StatusBadge state={candidate?.state ?? "draft"} />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleStateChange("ready")}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
          >
            Mark Ready
          </button>
          <button
            onClick={() => handleStateChange("awaiting_response")}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            Mark Awaiting
          </button>
          <button
            disabled={!bundle || !bundle.forms.some((f) => f.extracted_fields.some((ef) => ef.status !== "green"))}
            onClick={() => setShowEmailModal(true)}
            className={
              bundle && bundle.forms.some((f) => f.extracted_fields.some((ef) => ef.status !== "green"))
                ? "rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                : "rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-400 cursor-not-allowed"
            }
          >
            Draft Email
          </button>
        </div>
      </header>

      {/* Warning banner */}
      {bundle && bundle.warnings.length > 0 && (
        <div className="flex shrink-0 items-center gap-2 border-b border-amber-200 bg-amber-50 px-6 py-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <p className="text-sm text-amber-800">{bundle.warnings.join(" \u2014 ")}</p>
        </div>
      )}

      {/* Split pane */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left pane - Page Viewer */}
        <div className="w-1/2 border-r border-neutral-200">
          {activePacketId && totalPages > 0 ? (
            <PageViewer
              packetId={activePacketId}
              totalPages={totalPages}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-neutral-400">
              No pages available
            </div>
          )}
        </div>

        {/* Right pane - Extracted Data */}
        <div className="w-1/2 overflow-y-auto bg-neutral-50 p-4">
          <div className="space-y-4">
            {/* PrismHR Codes */}
            {bundle?.prism_codes && (
              <PrismCodesCard codes={bundle.prism_codes} />
            )}

            {/* Prism API Payload Preview */}
            {bundle && (
              <PrismPayloadCard candidateId={id} />
            )}

            {/* Reconciliation */}
            {bundle?.reconciliation && (
              <ReconciliationPanel
                reconciliation={bundle.reconciliation}
                onConfirm={handleReconciliationConfirm}
              />
            )}

            {/* Form Sections */}
            {bundle?.forms.map((form, idx) => (
              <FormSection
                key={form.id}
                formType={form.type}
                fields={form.extracted_fields}
                pageRange={form.page_range}
                confidenceSummary={form.confidence_summary}
                defaultExpanded={idx === 0}
                onSelectPage={setCurrentPage}
              />
            ))}

            {/* No bundle yet but not draft */}
            {!bundle && (
              <div className="flex flex-col items-center gap-3 py-12">
                <p className="text-sm text-neutral-500">No analysis data yet.</p>
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
                >
                  {analyzing && <Loader2 className="h-4 w-4 animate-spin" />}
                  {analyzing ? "Analyzing..." : "Run Analysis"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <EmailDraftModal
        open={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        candidateId={id}
        candidateName={candidateName}
        bundle={bundle}
      />
    </div>
  );
}
