"use client";
import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import useNativeAIRequest from "@/lib/useNativeAIRequest";
import NativeAIReport from "@/components/NativeAIReport";

type AIResult = { text: string; model?: string; providerReceipt?: { requestId: string; model: string } };
const modes = [{ id: "design_ideas", label: "Design ideas" }, { id: "material_recommender", label: "Recommend a material" }];
const examples = [
  { label: "Compact kitchen", mode: "design_ideas", text: "Fictional planning example: a compact north-facing kitchen with white shaker cabinets, limited daylight and daily family use. Propose durable, low-maintenance cabinet and countertop choices within a proposed USD 5,000 material budget. Explain assumptions and trade-offs; verify measurements and quotes before ordering." },
  { label: "Busy family home", mode: "material_recommender", text: "Fictional planning example: a family kitchen with warm wood cabinets, frequent cooking and a preference for easy cleaning. Compare granite, quartz and marble with a proposed USD 7,500 material budget. Describe maintenance and practical design choices without promising unverified prices or performance." },
  { label: "Bathroom refresh", mode: "design_ideas", text: "Fictional planning example: a small bathroom with pale tile, a compact vanity and a preference for a calm natural look. Suggest moisture-conscious cabinet and countertop options within a proposed USD 3,000 material budget. Identify measurements, installation details and costs that need confirmation." },
];

export function AiDesignAssistant() {
  const [mode, setMode] = useState("design_ideas"), [input, setInput] = useState("");
  const request = useNativeAIRequest<AIResult>();
  async function run() {
    if (!input.trim()) return;
    await request.run(async signal => {
      const response = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ feature: mode, prompt: input }), signal });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Could not generate suggestions.");
      return data;
    });
  }
  return <div className="rounded-md border border-gold/30 bg-gold/5 p-5">
    <div className="flex items-center gap-2"><Sparkles size={18} className="text-gold" /><h2 className="text-lg font-semibold text-white">AI design assistant</h2></div>
    <p className="mt-1 text-sm text-muted-foreground">Describe your space for reviewable ideas and material suggestions.</p>
    <div className="mt-4 flex flex-wrap gap-2">{modes.map(choice => <button key={choice.id} type="button" aria-pressed={mode === choice.id}
      onClick={() => { request.cancel(); request.clear(); setMode(choice.id); }} className={cn("rounded-sm border px-3 py-1.5 text-xs", mode === choice.id ? "border-gold bg-gold text-primary-foreground" : "border-border text-stone-200")}>{choice.label}</button>)}</div>
    <div className="mt-3 flex flex-wrap gap-2" aria-label="Complete examples">{examples.map(example => <button key={example.label} type="button" disabled={request.loading}
      onClick={() => { setMode(example.mode); setInput(example.text); request.clear(); request.setStatus("The complete planning brief is filled. Review it before generating."); }} className="rounded-sm border border-gold/40 px-3 py-2 text-xs text-gold disabled:opacity-50">Fill: {example.label}</button>)}</div>
    <label htmlFor="cabinet-design-brief" className="mt-3 block text-sm text-stone-200">Project brief</label>
    <textarea id="cabinet-design-brief" value={input} onChange={event => setInput(event.target.value)} rows={4} maxLength={4000} disabled={request.loading}
      className="mt-1 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm text-white" />
    <div className="mt-3 flex flex-wrap gap-3"><button type="button" onClick={run} disabled={request.loading || !input.trim()} className="btn-gold flex items-center gap-2 px-6 py-2.5 text-sm disabled:opacity-50">
      {request.loading && <Loader2 size={16} className="animate-spin" />}{request.loading ? "Generating…" : "Generate with OpenRouter"}</button>
      <button type="button" onClick={() => { if (!request.loading) setInput(""); request.cancel(); }} className="border border-border px-4 py-2 text-sm text-stone-200">{request.loading ? "Cancel request" : "Cancel"}</button></div>
    {request.status && <p role="status" className="mt-3 text-xs text-muted-foreground">{request.status}</p>}
    {request.error && <p role="alert" className="mt-3 text-sm text-red-400">{request.error}</p>}
    {request.result && <div className="mt-4 rounded-sm border border-border bg-card p-4 text-stone-200"><NativeAIReport value={request.result.text} title="Design report" />
      {request.result.providerReceipt && <p className="mt-3 text-xs text-muted-foreground">Model: {request.result.providerReceipt.model} · Request: {request.result.providerReceipt.requestId}</p>}</div>}
  </div>;
}
