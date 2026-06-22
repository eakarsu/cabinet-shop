"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, Pencil } from "lucide-react";

export function LeadNotes({ id, value }: { id: string; value: string | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value ?? "");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const res = await fetch(`/api/quotes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes: text }),
      });
      if (!res.ok) throw new Error();
      setOk(true);
      setEditing(false);
      router.refresh();
      setTimeout(() => setOk(false), 1200);
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex max-w-[180px] items-center gap-1.5 text-left text-xs text-muted-foreground hover:text-gold"
      >
        <Pencil size={12} className="shrink-0" />
        <span className="truncate">{value ? value : "Add note"}</span>
        {ok && <Check size={12} className="text-gold" />}
      </button>
    );
  }

  return (
    <div className="w-48">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        className="w-full rounded-sm border border-input bg-background px-2 py-1 text-xs text-white outline-none focus:border-gold"
        placeholder="Internal note…"
      />
      <div className="mt-1 flex gap-2">
        <button
          onClick={save}
          disabled={busy}
          className="rounded-sm bg-gold px-2 py-1 text-xs font-semibold text-primary-foreground"
        >
          {busy ? <Loader2 size={11} className="animate-spin" /> : "Save"}
        </button>
        <button onClick={() => setEditing(false)} className="text-xs text-muted-foreground hover:text-white">
          Cancel
        </button>
      </div>
    </div>
  );
}
