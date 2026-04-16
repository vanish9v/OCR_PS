// apps/web/src/lib/api.ts
import type { Candidate, Client } from "@/types/entities";

const API = "/api";

// For long-running calls (analyze takes 60-120s), call the API directly
// to bypass Next.js rewrite proxy timeout (~30s default)
const API_DIRECT = typeof window !== "undefined"
  ? `http://${window.location.hostname}:8000`
  : "http://api:8000";

export async function listCandidates(): Promise<Candidate[]> {
  const r = await fetch(`${API}/candidates`);
  if (!r.ok) throw new Error(`listCandidates: ${r.status}`);
  return r.json();
}

export async function getCandidate(id: string): Promise<Candidate & { packets: any[]; analyze_bundle?: any }> {
  const r = await fetch(`${API}/candidates/${id}`);
  if (!r.ok) throw new Error(`getCandidate: ${r.status}`);
  return r.json();
}

export async function updateCandidateState(id: string, state: string): Promise<Candidate> {
  const r = await fetch(`${API}/candidates/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state }),
  });
  if (!r.ok) throw new Error(`updateCandidateState: ${r.status}`);
  return r.json();
}

export async function uploadPacket(file: File, clientId: string): Promise<{
  candidate_id: string;
  packet_id: string;
  page_count: number;
  page_paths: string[];
}> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("client_id", clientId);
  const r = await fetch(`${API}/packets`, { method: "POST", body: fd });
  if (!r.ok) throw new Error(`uploadPacket: ${r.status}`);
  return r.json();
}

export async function analyzeCandidate(candidateId: string): Promise<any> {
  // Use direct API call to bypass Next.js proxy timeout (analyze takes 60-120s)
  const r = await fetch(`${API_DIRECT}/candidates/${candidateId}/analyze`, { method: "POST" });
  if (!r.ok) {
    const text = await r.text().catch(() => "unknown error");
    throw new Error(`analyzeCandidate: ${r.status} — ${text}`);
  }
  return r.json();
}

export async function listClients(): Promise<Client[]> {
  const r = await fetch(`${API}/clients`);
  if (!r.ok) throw new Error(`listClients: ${r.status}`);
  return r.json();
}

export async function getClient(id: string): Promise<Client> {
  const r = await fetch(`${API}/clients/${id}`);
  if (!r.ok) throw new Error(`getClient: ${r.status}`);
  return r.json();
}

export async function saveBundle(candidateId: string, bundle: any): Promise<void> {
  const r = await fetch(`${API}/candidates/${candidateId}/bundle`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bundle),
  });
  if (!r.ok) console.error("saveBundle failed:", r.status);
}

export async function draftEmail(candidateId: string, payload: {
  candidate_name: string;
  issues: Array<{ field: string; form: string; reason: string }>;
}): Promise<{ subject: string; body: string; to: string }> {
  const r = await fetch(`${API_DIRECT}/candidates/${candidateId}/draft-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`draftEmail: ${r.status}`);
  return r.json();
}

export async function getPrismPreview(candidateId: string): Promise<Record<string, any>> {
  const r = await fetch(`${API}/candidates/${candidateId}/prism-preview`);
  if (!r.ok) throw new Error(`getPrismPreview: ${r.status}`);
  return r.json();
}

export function pageImageUrl(packetId: string, pageNum: number): string {
  return `${API}/pages/${packetId}/${pageNum}`;
}
