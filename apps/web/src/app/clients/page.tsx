"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/topbar";
import { listClients } from "@/lib/api";
import type { Client } from "@/types/entities";

/* ── tiny helpers ───────────────────────────────────────── */

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
      {children}
    </span>
  );
}

function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-3">
      <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
      {subtitle && (
        <p className="mt-0.5 text-xs text-neutral-500">{subtitle}</p>
      )}
    </div>
  );
}

function CodeRow({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="w-32 shrink-0 text-xs font-medium text-neutral-500">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <Badge key={v}>{v}</Badge>
        ))}
      </div>
    </div>
  );
}

function MappingTable({
  title,
  map,
}: {
  title: string;
  map: Record<string, string>;
}) {
  const entries = Object.entries(map);
  if (entries.length === 0) return null;

  return (
    <div className="min-w-[200px]">
      <h4 className="mb-2 text-xs font-semibold text-neutral-700">{title}</h4>
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-neutral-200">
            <th className="pb-1.5 pr-4 font-medium text-neutral-500">
              Form Value
            </th>
            <th className="pb-1.5 font-medium text-neutral-500">
              PrismHR Code
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([formValue, code]) => (
            <tr key={formValue} className="border-b border-neutral-100">
              <td className="py-1.5 pr-4 text-neutral-700">{formValue}</td>
              <td className="py-1.5 font-medium text-violet-600">{code}</td>
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

  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
      {/* header */}
      <div className="border-b border-neutral-200 px-6 py-4">
        <div className="flex items-baseline gap-3">
          <h2 className="text-lg font-semibold text-neutral-900">
            {client.name}
          </h2>
          <span className="text-xs text-neutral-400">ID: {client.id}</span>
        </div>
        {client.address && (
          <p className="mt-1 text-sm text-neutral-500">{client.address}</p>
        )}
      </div>

      {/* body */}
      <div className="space-y-6 px-6 py-5">
        {/* ── Section 1: Valid Codes ── */}
        <section>
          <SectionHeading title="Valid Codes" />
          <div className="space-y-2.5">
            <CodeRow
              label="Pay Groups"
              values={[client.pay_group_constant]}
            />
            {benefitGroups.length > 0 && (
              <CodeRow label="Benefit Groups" values={benefitGroups} />
            )}
            {locations.length > 0 && (
              <CodeRow label="Locations" values={locations} />
            )}
            {jobCodes.length > 0 && (
              <CodeRow label="Job Codes" values={jobCodes} />
            )}
            {employeeTypes.length > 0 && (
              <CodeRow label="Employee Types" values={employeeTypes} />
            )}
          </div>
        </section>

        {/* ── Section 2: Code Mappings ── */}
        <section>
          <SectionHeading
            title="Code Mappings"
            subtitle="Maps text found on paper forms to PrismHR system codes"
          />
          <div className="flex flex-wrap gap-8">
            <MappingTable
              title="Job Codes"
              map={client.position_title_to_job_code}
            />
            <MappingTable
              title="Locations"
              map={client.organization_level_to_location}
            />
            <MappingTable
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
