"use client";
import { useState } from "react";

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("client_id", "15650");
    const r = await fetch("/api/packets", { method: "POST", body: fd });
    setResult(await r.json());
    setBusy(false);
  }

  return (
    <main className="mx-auto max-w-2xl p-10">
      <h1 className="text-2xl font-semibold">Upload packet</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input
          type="file" accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full border border-neutral-300 rounded px-3 py-2"
        />
        <button
          type="submit" disabled={!file || busy}
          className="bg-neutral-900 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {busy ? "Uploading…" : "Upload"}
        </button>
      </form>
      {result ? (
        <pre className="mt-6 p-4 bg-neutral-100 rounded text-sm overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </main>
  );
}
