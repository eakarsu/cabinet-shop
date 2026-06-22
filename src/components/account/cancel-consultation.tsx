"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function CancelConsultation({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [, startTransition] = useTransition();

  async function cancel() {
    setBusy(true);
    try {
      const res = await fetch(`/api/consultations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (!res.ok) throw new Error();
      startTransition(() => router.refresh());
    } catch {
      setBusy(false);
      setConfirm(false);
    }
  }

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="btn-outline-gold px-3 py-1.5 text-xs"
      >
        Cancel
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        onClick={cancel}
        disabled={busy}
        className="rounded-sm bg-red-500/90 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500"
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : "Confirm cancel"}
      </button>
      <button
        onClick={() => setConfirm(false)}
        disabled={busy}
        className="text-xs text-muted-foreground hover:text-white"
      >
        Keep
      </button>
    </span>
  );
}
