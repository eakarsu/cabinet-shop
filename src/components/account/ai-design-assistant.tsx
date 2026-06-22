"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const MODES = [
  { id: "design_ideas", label: "Design ideas" },
  { id: "material_recommender", label: "Recommend a material" },
];

export function AiDesignAssistant() {
  const [mode, setMode] = useState("design_ideas");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  async function run() {
    if (!input.trim() || loading) return;
    setLoading(true);
    setError("");
    setResult("");
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature: mode, prompt: input }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setResult(data.text || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-md border border-gold/30 bg-gold/5 p-5">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-gold" />
        <h2 className="text-lg font-semibold text-white">AI design assistant</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Describe your space and we&apos;ll suggest ideas and materials.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={cn(
              "rounded-sm border px-3 py-1.5 text-xs transition-colors",
              mode === m.id
                ? "border-gold bg-gold text-primary-foreground"
                : "border-border text-stone-200 hover:border-gold/50"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={3}
        placeholder="e.g. Small north-facing kitchen, white shaker cabinets, want low-maintenance counters under $5k…"
        className="mt-3 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm text-white outline-none focus:border-gold"
      />

      <button
        onClick={run}
        disabled={loading || !input.trim()}
        className="btn-gold mt-3 flex items-center gap-2 px-6 py-2.5 text-sm disabled:opacity-50"
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {loading ? "Thinking…" : "Get suggestions"}
      </button>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      {result && (
        <div className="mt-4 whitespace-pre-wrap rounded-sm border border-border bg-card p-4 text-sm text-stone-200">
          {result}
        </div>
      )}
    </div>
  );
}
