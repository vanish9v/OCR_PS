const palette: Record<string, string> = {
  draft: "bg-neutral-100 text-neutral-600",
  under_review: "bg-amber-100 text-amber-700",
  awaiting_response: "bg-orange-100 text-orange-700",
  ready: "bg-green-100 text-green-700",
  submitting: "bg-blue-100 text-blue-700",
  committed: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
};

function humanize(state: string): string {
  return state
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface StatusBadgeProps {
  state: string;
}

export function StatusBadge({ state }: StatusBadgeProps) {
  const colors = palette[state] ?? "bg-neutral-100 text-neutral-600";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors}`}
    >
      {humanize(state)}
    </span>
  );
}
