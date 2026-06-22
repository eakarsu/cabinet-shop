"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function StatusSelect({
  id,
  value,
  options,
  endpoint,
}: {
  id: string;
  value: string;
  options: string[];
  endpoint: string; // e.g. "/api/quotes"
}) {
  const router = useRouter();
  const [status, setStatus] = useState(value);
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();

  async function onChange(next: string) {
    const prev = status;
    setStatus(next);
    setSaving(true);
    try {
      const res = await fetch(`${endpoint}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error();
      startTransition(() => router.refresh());
    } catch {
      setStatus(prev); // revert on failure
    } finally {
      setSaving(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <select
        value={status}
        onChange={(e) => onChange(e.target.value)}
        disabled={saving}
        className="rounded-sm border border-input bg-background px-2 py-1 text-xs text-white outline-none focus:border-gold"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {saving && <Loader2 size={14} className="animate-spin text-gold" />}
    </span>
  );
}
