"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CalendarClock } from "lucide-react";

const SLOTS = ["09:00", "10:30", "13:00", "14:30", "16:00"];

export function RescheduleConsultation({
  id,
  date,
  time,
  version,
}: {
  id: string;
  date: string; // YYYY-MM-DD
  time: string;
  version: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [d, setD] = useState(date);
  const [t, setT] = useState(time);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(`/api/consultations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: d, time: t, expectedVersion: version }),
      });
      if (!res.ok) throw new Error((await res.json())?.error || "Failed");
      setOpen(false);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-outline-gold flex items-center gap-1.5 px-3 py-1.5 text-xs"
      >
        <CalendarClock size={14} /> Reschedule
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="date"
        value={d}
        onChange={(e) => setD(e.target.value)}
        className="rounded-sm border border-input bg-background px-2 py-1 text-xs text-white outline-none focus:border-gold"
      />
      <select
        value={t}
        onChange={(e) => setT(e.target.value)}
        className="rounded-sm border border-input bg-background px-2 py-1 text-xs text-white outline-none focus:border-gold"
      >
        {SLOTS.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <button
        onClick={save}
        disabled={busy}
        className="rounded-sm bg-gold px-3 py-1.5 text-xs font-semibold text-primary-foreground"
      >
        {busy ? <Loader2 size={12} className="animate-spin" /> : "Save"}
      </button>
      <button onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-white">
        Cancel
      </button>
      {err && <span className="text-xs text-red-400">{err}</span>}
    </div>
  );
}
