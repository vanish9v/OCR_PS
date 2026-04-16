"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { FormFieldRow } from "@/components/form-field-row";
import type { FormType, Field } from "@/types/entities";

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

function humanizeFormType(type: FormType): string {
  return FORM_TYPE_LABELS[type] ?? type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface FormSectionProps {
  formType: FormType;
  fields: Field[];
  pageRange: number[];
  confidenceSummary: Record<string, number>;
  defaultExpanded?: boolean;
  onSelectPage: (page: number) => void;
}

export function FormSection({
  formType,
  fields,
  pageRange,
  confidenceSummary,
  defaultExpanded = false,
  onSelectPage,
}: FormSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const issueCount = fields.filter((f) => f.status === "red" || f.status === "orange").length;

  function handleHeaderClick() {
    setExpanded((prev) => !prev);
    if (pageRange.length > 0) {
      onSelectPage(pageRange[0]);
    }
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white">
      {/* Header */}
      <button
        onClick={handleHeaderClick}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-neutral-50"
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-neutral-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-neutral-400" />
          )}
          <span className="text-sm font-semibold text-neutral-900">
            {humanizeFormType(formType)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">
            {fields.length} field{fields.length !== 1 ? "s" : ""}
          </span>
          {issueCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              {issueCount} issue{issueCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </button>

      {/* Fields */}
      {expanded && (
        <div className="space-y-1 border-t border-neutral-100 px-4 py-2">
          {fields.map((field) => (
            <FormFieldRow
              key={field.name}
              name={field.name}
              value={field.value}
              status={field.status}
              confidence={field.confidence}
            />
          ))}
        </div>
      )}
    </div>
  );
}
