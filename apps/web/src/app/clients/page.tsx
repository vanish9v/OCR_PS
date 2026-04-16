"use client";

import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { listClients } from "@/lib/api";
import type { Client } from "@/types/entities";

/* ── humanized labels for codes ─────────────────────────── */

const JOB_CODE_LABELS: Record<string, string> = {
  OW: "Owner",
  IN: "Instructor",
  RW: "Retail Worker",
};

const LOCATION_LABELS: Record<string, string> = {
  "1": "Retail",
  "2": "Beach",
};

const EMPLOYEE_TYPE_LABELS: Record<string, string> = {
  FT: "Full Time",
  PT: "Part Time",
  CA: "Casual",
};

function humanize(code: string, dict: Record<string, string>): string {
  const label = dict[code];
  return label ? `${code} (${label})` : code;
}

/* ── tiny helpers ───────────────────────────────────────── */

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
      {children}
    </span>
  );
}

function CodeRow({ label, values }: { label: string; values: string[] }) {
  if (values.length === 0) return null;
  return (
    <div className="grid grid-cols-[140px_1fr] items-start gap-3">
      <span className="pt-0.5 text-xs font-medium text-neutral-500">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <Pill key={v}>{v}</Pill>
        ))}
      </div>
    </div>
  );
}

function MappingCard({
  title,
  map,
}: {
  title: string;
  map: Record<string, string>;
}) {
  const entries = Object.entries(map);
  if (entries.length === 0) return null;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {title}
      </h4>
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-neutral-200">
            <th className="pb-2 pr-4 font-medium text-neutral-500">
              Form Value
            </th>
            <th className="pb-2 font-medium text-neutral-500">PrismHR Code</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([formValue, code], idx) => (
            <tr
              key={formValue}
              className={
                idx < entries.length - 1 ? "border-b border-neutral-100" : ""
              }
            >
              <td className="py-2 pr-4 text-neutral-700">{formValue}</td>
              <td className="py-2 font-medium text-violet-600">{code}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── card for a single client ──────────────────────────── */

function ClientCard({ client }: { client: Client }) {
  const codes = client.codes ?? {};
  const benefitGroups = codes.benefit_groups ?? [];
  const locations = codes.locations ?? [];
  const jobCodes = codes.job_codes ?? [];
  const employeeTypes = codes.employee_types ?? [];

  const jobCodePills = jobCodes.map((c) => humanize(c, JOB_CODE_LABELS));
  const locationPills = locations.map((c) => humanize(c, LOCATION_LABELS));
  const employeeTypePills = employeeTypes.map((c) =>
    humanize(c, EMPLOYEE_TYPE_LABELS),
  );

  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
      {/* header */}
      <div className="border-b border-neutral-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-neutral-400" />
          <h2 className="text-lg font-semibold text-neutral-900">
            {client.name}
          </h2>
          <span className="text-sm font-normal text-neutral-400">
            #{client.id}
          </span>
        </div>
        {client.address && (
          <p className="mt-1 text-sm text-neutral-500">{client.address}</p>
        )}
      </div>

      {/* body */}
      <div className="space-y-6 px-6 py-5">
        {/* ── Section 1: Valid Codes ── */}
        <section>
          <h3 className="mb-3 text-sm font-semibold text-neutral-900">
            Valid Codes
          </h3>
          <div className="space-y-2.5">
            <CodeRow
              label="Pay Groups"
              values={[client.pay_group_constant]}
            />
            <CodeRow label="Benefit Groups" values={benefitGroups} />
            <CodeRow label="Locations" values={locationPills} />
            <CodeRow label="Job Codes" values={jobCodePills} />
            <CodeRow label="Employee Types" values={employeeTypePills} />
          </div>
        </section>

        {/* ── Section 2: Code Mappings ── */}
        <section>
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-neutral-900">
              Code Mappings
            </h3>
            <p className="mt-0.5 text-xs text-neutral-500">
              Maps text found on paper forms to PrismHR system codes
            </p>
          </div>
          <div className="space-y-3">
            <MappingCard
              title="Job Codes"
              map={client.position_title_to_job_code}
            />
            <MappingCard
              title="Locations"
              map={client.organization_level_to_location}
            />
            <MappingCard
              title="Employee Status"
              map={client.status_to_employee_type}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

/* ── page ───────────────────────────────────────────────── */

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    listClients()
      .then(setClients)
      .catch(() => {
        /* TODO: error state */
      });
  }, []);

  return (
    <div className="flex h-full flex-col">
      <Topbar title="Clients" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {clients.map((c) => (
            <ClientCard key={c.id} client={c} />
          ))}
        </div>
      </div>
    </div>
  );
}
