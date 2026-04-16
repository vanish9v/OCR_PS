const CODE_LABELS: Record<string, string> = {
  job_code: "Job Code",
  location: "Location",
  employee_type: "Employee Type",
  benefit_group: "Benefit Group",
  pay_group: "Pay Group",
  status: "Status",
};

function humanizeKey(key: string): string {
  return CODE_LABELS[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface PrismCodesCardProps {
  codes: Record<string, string | null>;
}

export function PrismCodesCard({ codes }: PrismCodesCardProps) {
  const entries = Object.entries(codes);

  if (entries.length === 0) return null;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white">
      <div className="border-b border-neutral-100 px-4 py-2.5">
        <h3 className="text-sm font-semibold text-neutral-900">PrismHR Codes</h3>
      </div>
      <div className="grid grid-cols-3 gap-px bg-neutral-100 p-px">
        {entries.map(([key, value]) => (
          <div key={key} className="bg-white px-3 py-2">
            <p className="text-xs text-neutral-500">{humanizeKey(key)}</p>
            <p
              className={`text-sm font-medium ${
                value == null ? "text-red-500" : "text-neutral-900"
              }`}
            >
              {value ?? "unmapped"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
