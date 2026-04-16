import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";
import type { FieldStatus } from "@/types/entities";

interface FormFieldRowProps {
  name: string;
  value: unknown;
  status: FieldStatus;
  confidence?: number | null;
}

const borderByStatus: Record<FieldStatus, string> = {
  green: "border-l-green-500",
  red: "border-l-red-500",
  orange: "border-l-orange-400",
  yellow: "border-l-yellow-400",
};

const StatusIcon: Record<FieldStatus, React.FC<{ className?: string }>> = {
  green: CheckCircle2,
  red: XCircle,
  orange: AlertTriangle,
  yellow: Info,
};

const iconColor: Record<FieldStatus, string> = {
  green: "text-green-500",
  red: "text-red-500",
  orange: "text-orange-400",
  yellow: "text-yellow-400",
};

function humanizeFieldName(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function FormFieldRow({ name, value, status, confidence }: FormFieldRowProps) {
  const Icon = StatusIcon[status];
  const displayValue = value == null ? "" : String(value);

  return (
    <div className={`flex items-start gap-3 border-l-4 ${borderByStatus[status]} py-2 pl-3 pr-2`}>
      {/* Label */}
      <div className="w-44 shrink-0">
        <p className="text-sm font-medium text-neutral-700">{humanizeFieldName(name)}</p>
        {status === "red" && (
          <p className="text-xs text-red-500">
            {displayValue ? "Low confidence" : "Missing \u2014 required field"}
          </p>
        )}
      </div>

      {/* Editable input */}
      <div className="flex-1">
        <input
          type="text"
          defaultValue={displayValue}
          className="w-full rounded border border-neutral-200 bg-white px-2.5 py-1.5 text-sm text-neutral-900 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400"
        />
      </div>

      {/* Status icon */}
      <div className="flex shrink-0 items-center pt-1.5">
        <Icon className={`h-5 w-5 ${iconColor[status]}`} />
        {confidence != null && (
          <span className="ml-1 text-xs text-neutral-400">{Math.round(confidence * 100)}%</span>
        )}
      </div>
    </div>
  );
}
