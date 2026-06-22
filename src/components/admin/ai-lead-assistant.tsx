"use client";

import { useState } from "react";
import { Sparkles, Loader2, ClipboardCopy, Check } from "lucide-react";

type Lead = {
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
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const promptFor = () =>
    `Lead details:\n` +
    `Name: ${lead.name}\nEmail: ${lead.email}\nPhone: ${lead.phone}\n` +
    `Project: ${lead.projectType ?? "—"}\nMaterial: ${lead.material ?? "—"}\n` +
    `Zip: ${lead.zip ?? "—"}\nStatus: ${lead.status}\nSource: ${lead.source}\n` +
    `Message: ${lead.message ?? "(none)"}`;

  async function run(feature: string) {
    setLoading(feature);
    setError("");
    setResult("");
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature, prompt: promptFor() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setResult(data.text || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(null);
    }
  }

  function copy() {
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-sm border border-gold/40 px-3 py-1.5 text-xs text-gold hover:bg-gold/10"
      >
        <Sparkles size={14} /> AI
      </button>

      {open && (
        <div className="mt-3 rounded-md border border-border bg-background p-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => run("lead_summary")}
              disabled={!!loading}
              className="btn-outline-gold flex items-center gap-1.5 px-3 py-1.5 text-xs"
            >
              {loading === "lead_summary" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Sparkles size={14} />
              )}
              Summarize &amp; next step
            </button>
            <button
              onClick={() => run("lead_reply")}
              disabled={!!loading}
              className="btn-outline-gold flex items-center gap-1.5 px-3 py-1.5 text-xs"
            >
              {loading === "lead_reply" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Sparkles size={14} />
              )}
              Draft reply
            </button>
          </div>

          {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

          {result && (
            <div className="mt-3">
              <div className="whitespace-pre-wrap rounded-sm bg-card p-3 text-sm text-stone-200">
                {result}
              </div>
              <button
                onClick={copy}
                className="mt-2 flex items-center gap-1.5 text-xs text-gold hover:underline"
              >
                {copied ? <Check size={14} /> : <ClipboardCopy size={14} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
