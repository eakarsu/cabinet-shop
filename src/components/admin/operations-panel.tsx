"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Outreach = { id: string; channel: string; subject: string | null; body: string; status: string; createdBy: { name: string | null; email: string } };

export function OperationsPanel({ outreach }: { outreach: Outreach[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function decide(id: string, decision: "approve" | "reject") {
    const reason = decision === "reject" ? window.prompt("Rejection reason") : undefined;
    if (decision === "reject" && !reason) return;
    setBusy(id); setError("");
    const response = await fetch(`/api/sales/outreach/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, reason }),
    });
    if (!response.ok) setError((await response.json())?.error || "Review failed.");
    else router.refresh();
    setBusy(null);
  }

  return (
    <section className="rounded-md border border-border bg-card p-5">
      <h2 className="font-semibold text-white">Outreach awaiting independent review</h2>
      <p className="mt-1 text-sm text-muted-foreground">Approval rechecks consent and suppression. An author cannot approve their own message.</p>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      <div className="mt-4 space-y-3">
        {outreach.length === 0 && <p className="text-sm text-muted-foreground">No messages are waiting.</p>}
        {outreach.map((message) => (
          <article key={message.id} className="rounded-sm border border-border bg-background p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><span className="text-xs uppercase text-gold">{message.channel}</span><h3 className="font-medium text-white">{message.subject || "Project follow-up"}</h3></div>
              <span className="text-xs text-muted-foreground">Author: {message.createdBy.name || message.createdBy.email}</span>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm text-stone-300">{message.body}</p>
            <div className="mt-4 flex gap-2">
              <button disabled={busy === message.id} onClick={() => decide(message.id, "approve")} className="btn-gold px-4 py-2 text-xs">Approve &amp; queue</button>
              <button disabled={busy === message.id} onClick={() => decide(message.id, "reject")} className="btn-outline-gold px-4 py-2 text-xs">Reject</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

