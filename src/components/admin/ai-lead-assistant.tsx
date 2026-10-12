"use client";

import { useEffect, useState } from "react";
import useNativeAIRequest from "@/lib/useNativeAIRequest";
import NativeAIReport from "@/components/NativeAIReport";
import { Sparkles, Loader2, ClipboardCopy, Check } from "lucide-react";

type Lead = {
  id: string;
  contactId: string | null;
  name: string;
  email: string;
  phone: string;
  projectType?: string | null;
  material?: string | null;
  zip?: string | null;
  message?: string | null;
  status: string;
  source: string;
};

export function AiLeadAssistant({ lead }: { lead: Lead }) {
  const [open, setOpen] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [feature, setFeature] = useState("lead_summary");
  const [instructions, setInstructions] = useState("");
  const request = useNativeAIRequest<{ text: string; providerReceipt?: { requestId: string; model: string } }>();
  const loading = request.loading || reviewLoading;
  const result = request.result?.text || "";
  const error = request.error || reviewError;
  const [copied, setCopied] = useState(false);
  const [queued, setQueued] = useState(false);

  useEffect(() => { request.cancel(); request.clear(); setQueued(false); setInstructions(""); }, [lead.id]);

  const promptFor = () =>
    `Lead details:\n` +
    `Name: ${lead.name}\nEmail: ${lead.email}\nPhone: ${lead.phone}\n` +
    `Project: ${lead.projectType ?? "—"}\nMaterial: ${lead.material ?? "—"}\n` +
    `Zip: ${lead.zip ?? "—"}\nStatus: ${lead.status}\nSource: ${lead.source}\n` +
    `Message: ${lead.message ?? "(none)"}\nDrafting instructions: ${instructions || "Use only the saved lead details and identify missing information."}`;

  async function run() {
    setReviewError(""); setQueued(false);
    await request.run(async signal => {
      const response = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ feature, prompt: promptFor() }), signal });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Could not prepare the lead report.");
      return data;
    });
  }

  function copy() {
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  async function submitForReview() {
    if (!lead.contactId || !result) return;
    setReviewLoading(true); setReviewError("");
    const response = await fetch("/api/sales/outreach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quoteId: lead.id, contactId: lead.contactId, channel: "email", subject: `Your ${lead.projectType || "project"} inquiry`, body: result }),
    });
    if (!response.ok) setReviewError((await response.json())?.error || "Could not submit for review.");
    else setQueued(true);
    setReviewLoading(false);
  }

  return (
    <div>
      <button
        onClick={() => { if (open && request.loading) request.cancel(); setOpen(v => !v); }}
        className="flex items-center gap-1.5 rounded-sm border border-gold/40 px-3 py-1.5 text-xs text-gold hover:bg-gold/10"
      >
        <Sparkles size={14} /> AI
      </button>

      {open && (
        <div className="mt-3 rounded-md border border-border bg-background p-4">
          <div className="flex flex-wrap gap-2">
            {[{ id: "lead_summary", label: "Summary and next step" }, { id: "lead_reply", label: "Reply draft" }].map(choice => <button key={choice.id} type="button" disabled={reviewLoading} aria-pressed={feature === choice.id}
              onClick={() => { request.cancel(); request.clear(); setFeature(choice.id); setQueued(false); }} className="btn-outline-gold px-3 py-2 text-xs">{choice.label}</button>)}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Uses this saved lead’s actual details. Fill optional drafting instructions, then generate a report for review.</p>
          <div className="mt-3 flex flex-wrap gap-2" aria-label="Complete examples">
            {[
              { label: "Concise response", feature: "lead_reply", text: "Use the actual saved lead details. Keep the draft concise and factual; ask for missing measurements or project constraints. Do not invent a quote, appointment or completed work." },
              { label: "Clarify requirements", feature: "lead_summary", text: "Use the actual saved lead details. Identify unanswered material, layout and timeline questions and propose a clear next step. Do not invent prices, availability or customer information." },
              { label: "Consultation preparation", feature: "lead_reply", text: "Use the actual saved lead details. Prepare a courteous draft and a short list of facts to confirm before a consultation. Do not claim a message was sent or an appointment was booked." },
            ].map(example => <button key={example.label} type="button" disabled={loading} onClick={() => { setFeature(example.feature); setInstructions(example.text); request.clear(); setQueued(false); }} className="border border-gold/40 px-3 py-2 text-xs text-gold">Fill: {example.label}</button>)}
          </div>
          <label htmlFor={`lead-ai-instructions-${lead.id}`} className="mt-3 block text-xs text-stone-200">Drafting instructions (optional)</label>
          <textarea id={`lead-ai-instructions-${lead.id}`} value={instructions} onChange={event => setInstructions(event.target.value)} disabled={loading} rows={3} maxLength={1000} className="mt-1 w-full rounded-sm border border-input bg-card p-2 text-sm text-stone-200" />
          <div className="mt-3 flex flex-wrap gap-3"><button type="button" onClick={run} disabled={loading} className="btn-outline-gold flex items-center gap-2 px-3 py-2 text-xs">
            {request.loading && <Loader2 size={14} className="animate-spin" />}{request.loading ? "Generating…" : "Generate with OpenRouter"}</button>
            <button type="button" disabled={reviewLoading} onClick={() => { request.cancel(); if (!request.loading) setInstructions(""); }} className="border border-border px-3 py-2 text-xs text-stone-200">{request.loading ? "Cancel request" : "Cancel"}</button></div>
          {request.status && <p role="status" className="mt-3 text-xs text-muted-foreground">{request.status}</p>}

          {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

          {result && (
            <div className="mt-3">
              <div className="rounded-sm bg-card p-3 text-sm text-stone-200"><NativeAIReport value={result} title="Lead report" />
                {request.result?.providerReceipt && <p className="mt-2 text-xs text-muted-foreground">Model: {request.result.providerReceipt.model} · Request: {request.result.providerReceipt.requestId}</p>}
              </div>
              <button
                onClick={copy}
                className="mt-2 flex items-center gap-1.5 text-xs text-gold hover:underline"
              >
                {copied ? <Check size={14} /> : <ClipboardCopy size={14} />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                onClick={submitForReview}
                disabled={!!loading || !lead.contactId || queued}
                className="mt-2 ml-4 text-xs text-gold hover:underline disabled:opacity-50"
              >
                {queued ? "Submitted for independent review" : "Submit draft for review"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
