"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, Play, Save, Boxes, FileText, Loader2, Printer } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import {
  runOptimizer,
  type PartInput,
  type OptimizeResult,
  type Engine,
  type Rect,
  type BinLayout,
} from "@/lib/cut-optimizer";

const PALETTE = ["#c8a25a","#7c8aa5","#9c7b3d","#5a6b52","#8a5a5a","#6a7b8a","#a88a5a","#7a6a8a","#5a8a7a","#8a7a5a"];
// Standard slab dimensions (inches) and price tiers for the dropdowns.
const WIDTHS = [96, 108, 112, 118, 120, 126, 130];
const HEIGHTS = [52, 55, 63, 65, 70, 78];
const PRICES = [400, 500, 700, 900, 1100, 1400, 1600, 2000, 2500];

const DEFAULT_PARTS: PartInput[] = [
  { label: "Island top", w: 78, h: 54, qty: 4 },
  { label: "Counter run", w: 58, h: 46, qty: 4 },
  { label: "Sink base", w: 36, h: 26, qty: 2 },
  { label: "Backsplash", w: 107, h: 11, qty: 3 },
];

type Material = {
  id: string; name: string; category: string;
  slabWidth: number | null; slabHeight: number | null; slabCost: number | null;
  imageUrl: string | null;
};

const input = "w-full rounded-sm border border-input bg-background px-2 py-1.5 text-sm text-white outline-none focus:border-gold";

export default function OptimizePage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialId, setMaterialId] = useState("");
  const [slabW, setSlabW] = useState(126);
  const [slabH, setSlabH] = useState(63);
  const [slabCost, setSlabCost] = useState(900);
  const [kerf, setKerf] = useState(0.125);
  const [engine, setEngine] = useState<Engine>("maxrects");
  const [allowRotate, setAllowRotate] = useState(true);
  const [parts, setParts] = useState<PartInput[]>(DEFAULT_PARTS);
  const [defects, setDefects] = useState<Rect[]>([]);
  const [useRemnants, setUseRemnants] = useState(false);
  const [remnantStock, setRemnantStock] = useState<{ w: number; h: number; id: string }[]>([]);
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    fetch("/api/materials").then((r) => r.json()).then(setMaterials).catch(() => {});
    fetch("/api/optimize/jobs").then((r) => r.json()).then(setJobs).catch(() => {});
  }, []);

  function pickMaterial(id: string) {
    setMaterialId(id);
    const m = materials.find((x) => x.id === id);
    if (m) {
      if (m.slabWidth) setSlabW(m.slabWidth);
      if (m.slabHeight) setSlabH(m.slabHeight);
      if (m.slabCost != null) setSlabCost(m.slabCost);
    }
  }

  function setPart(i: number, patch: Partial<PartInput>) {
    setParts((ps) => ps.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }
  const addPart = () => setParts((ps) => [...ps, { label: `Part ${ps.length + 1}`, w: 24, h: 24, qty: 1 }]);
  const removePart = (i: number) => setParts((ps) => ps.filter((_, idx) => idx !== i));

  // Load saved remnants when the toggle / material changes.
  useEffect(() => {
    if (useRemnants && materialId) {
      fetch(`/api/remnants?materialId=${materialId}`)
        .then((r) => r.json())
        .then((rs) => setRemnantStock(rs.map((r: any) => ({ w: r.w, h: r.h, id: r.id }))))
        .catch(() => setRemnantStock([]));
    } else {
      setRemnantStock([]);
    }
  }, [useRemnants, materialId]);

  // Live recompute — any input change instantly updates the layout & stats.
  useEffect(() => {
    setResult(
      runOptimizer({ slabW, slabH, kerf, parts, allowRotate, engine, defects, remnants: remnantStock, slabCost })
    );
  }, [slabW, slabH, kerf, parts, allowRotate, engine, defects, remnantStock, slabCost]);

  function run() {
    setMsg("");
    setResult(
      runOptimizer({ slabW, slabH, kerf, parts, allowRotate, engine, defects, remnants: remnantStock, slabCost })
    );
  }

  async function saveJob() {
    if (!result) return;
    setBusy("job");
    try {
      await fetch("/api/optimize/jobs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: materials.find((m) => m.id === materialId)?.name ?? "Cut job",
          materialId: materialId || null, engine,
          input: { slabW, slabH, kerf, parts, allowRotate, defects },
          result, slabsUsed: result.slabsUsed, yieldPct: result.yieldPct, cost: result.cost,
        }),
      });
      setMsg("Saved job ✓");
      fetch("/api/optimize/jobs").then((r) => r.json()).then(setJobs);
    } finally { setBusy(""); }
  }

  async function saveRemnants() {
    if (!result) return;
    setBusy("rem");
    const remnants = result.bins.flatMap((b) =>
      b.freeRects.filter((r) => r.w >= 6 && r.h >= 6).map((r) => ({ materialId: materialId || null, label: "Remnant", w: Math.round(r.w), h: Math.round(r.h) }))
    );
    // Remnants that were consumed in this run → mark them used (lifecycle).
    const consumedIds = result.bins
      .filter((b) => b.kind === "remnant" && b.placements.length > 0 && b.remnantId)
      .map((b) => b.remnantId as string);
    try {
      const res = await fetch("/api/remnants", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ remnants }),
      });
      const d = await res.json();
      if (consumedIds.length > 0) {
        await fetch("/api/remnants", {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: consumedIds }),
        });
      }
      setMsg(
        res.ok
          ? `Saved ${d.created} new remnant(s)${consumedIds.length ? `, retired ${consumedIds.length} used` : ""} ✓`
          : d.error
      );
    } finally { setBusy(""); }
  }

  async function createEstimate() {
    if (!result) return;
    setBusy("quote");
    const mat = materials.find((m) => m.id === materialId);
    const lines = parts.map((p) => `${p.qty}× ${p.label} ${p.w}×${p.h}`).join("; ");
    try {
      await fetch("/api/quotes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Cut-plan estimate", email: "estimate@internal.local", phone: "—",
          material: mat?.name ?? null, projectType: "Countertop fabrication",
          message: `Optimized plan: ${result.slabsUsed} slab(s), ${result.yieldPct.toFixed(1)}% yield${result.cost != null ? `, material cost ~$${result.cost.toFixed(0)}` : ""}. Parts: ${lines}`,
          source: "ai_assistant",
        }),
      });
      setMsg("Estimate created in Estimates ✓");
    } finally { setBusy(""); }
  }

  function loadJob(j: any) {
    const i = j.input || {};
    if (i.slabW) setSlabW(i.slabW);
    if (i.slabH) setSlabH(i.slabH);
    if (i.kerf != null) setKerf(i.kerf);
    if (Array.isArray(i.parts)) setParts(i.parts);
    if (typeof i.allowRotate === "boolean") setAllowRotate(i.allowRotate);
    if (Array.isArray(i.defects)) setDefects(i.defects);
    if (j.engine) setEngine(j.engine);
    if (j.materialId) setMaterialId(j.materialId);
    setMsg("Loaded job ✓");
  }

  function printCutList() {
    if (!result) return;
    const mat = materials.find((m) => m.id === materialId);
    const win = window.open("", "_blank");
    if (!win) return;
    const partRows = parts
      .map((p) => `<tr><td>${p.label}</td><td>${p.w}"</td><td>${p.h}"</td><td>${p.qty}</td></tr>`)
      .join("");
    const bins = result.bins
      .map(
        (b, i) =>
          `<h3>${b.kind === "remnant" ? "Remnant" : "Slab"} ${i + 1} — ${b.w}"×${b.h}"</h3>
          <table><thead><tr><th>Part</th><th>X</th><th>Y</th><th>W</th><th>H</th><th>Rotated</th></tr></thead><tbody>${b.placements
            .map((p) => `<tr><td>${p.label}</td><td>${p.x.toFixed(1)}</td><td>${p.y.toFixed(1)}</td><td>${p.w}"</td><td>${p.h}"</td><td>${p.rotated ? "90°" : "—"}</td></tr>`)
            .join("")}</tbody></table>`
      )
      .join("");
    win.document.write(`<!doctype html><html><head><title>Cut List — ${mat?.name ?? "Custom"}</title>
      <style>body{font-family:Arial,sans-serif;margin:32px;color:#111}h1{margin:0 0 4px}table{border-collapse:collapse;width:100%;margin:8px 0 20px}th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;font-size:13px}th{background:#f3f3f3}.sum{color:#555;margin-bottom:16px}</style>
      </head><body>
      <h1>Cut List — ${mat?.name ?? "Custom slab"}</h1>
      <div class="sum">Slab ${result.slabW}"×${result.slabH}" · Slabs needed: <b>${result.slabsUsed}</b> · Yield: <b>${result.yieldPct.toFixed(1)}%</b> · Material cost: <b>${result.cost != null ? "$" + result.cost.toFixed(0) : "—"}</b></div>
      <h2>Parts</h2><table><thead><tr><th>Part</th><th>Width</th><th>Height</th><th>Qty</th></tr></thead><tbody>${partRows}</tbody></table>
      <h2>Cut layout</h2>${bins}
      <p style="color:#999;font-size:11px;margin-top:24px">Generated by Heritage Cut Optimizer · ${new Date().toLocaleString()}</p>
      </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  }

  const selMat = materials.find((m) => m.id === materialId);

  const colorFor = useMemo(() => {
    const map = new Map<string, string>(); let n = 0;
    return (label: string) => { if (!map.has(label)) map.set(label, PALETTE[n++ % PALETTE.length]); return map.get(label)!; };
  }, [result]);

  // Live comparison of all three engines on the current inputs.
  const comparison = useMemo(() => {
    const engines: Engine[] = ["shelf", "maxrects", "freeform"];
    return engines.map((e) => {
      const r = runOptimizer({ slabW, slabH, kerf, parts, allowRotate, engine: e, defects, remnants: remnantStock, slabCost });
      return { engine: e, slabs: r.slabsUsed, yieldPct: r.yieldPct };
    });
  }, [slabW, slabH, kerf, parts, allowRotate, defects, remnantStock, slabCost]);
  const bestSlabs = Math.min(...comparison.map((c) => c.slabs));

  return (
    <>
      <AdminPageHeader title="Cut Optimizer" subtitle="Nest countertop parts on slabs to cut waste — yield, cost, remnants, defects & free-form." />
      <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[380px_1fr]">
        {/* INPUTS */}
        <div className="space-y-5">
          <div className="rounded-md border border-border bg-card p-5 space-y-3">
            <h3 className="font-semibold text-white">Material &amp; slab</h3>
            <select value={materialId} onChange={(e) => pickMaterial(e.target.value)} className={`w-full ${input}`}>
              <option value="">— Custom slab —</option>
              {materials
                .filter((m) => m.slabWidth && m.slabHeight)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </select>
            <div className="grid grid-cols-3 gap-2">
              <DimSelect label="Width (in)" value={slabW} set={setSlabW} options={WIDTHS} />
              <DimSelect label="Height (in)" value={slabH} set={setSlabH} options={HEIGHTS} />
              <DimSelect label="Price" value={slabCost} set={setSlabCost} options={PRICES} prefix="$" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-muted-foreground">Kerf (in)<input type="number" step="0.0625" value={kerf} onChange={(e) => setKerf(+e.target.value)} className={`mt-1 w-full ${input}`} /></label>
              <label className="text-xs text-muted-foreground">Engine
                <select value={engine} onChange={(e) => setEngine(e.target.value as Engine)} className={`mt-1 w-full ${input}`}>
                  <option value="shelf">Fast (shelf)</option>
                  <option value="maxrects">Best yield (MaxRects)</option>
                  <option value="freeform">Free-form (raster)</option>
                </select>
              </label>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <label className="flex items-center gap-2"><input type="checkbox" checked={allowRotate} onChange={(e) => setAllowRotate(e.target.checked)} className="h-4 w-4 accent-[hsl(var(--gold))]" /> Allow rotation</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={useRemnants} onChange={(e) => setUseRemnants(e.target.checked)} className="h-4 w-4 accent-[hsl(var(--gold))]" /> Use saved remnants</label>
            </div>
          </div>

          {/* Defects editor */}
          <DefectEditor slabW={slabW} slabH={slabH} defects={defects} setDefects={setDefects} imageUrl={selMat?.imageUrl ?? null} />

          {/* Parts */}
          <div className="rounded-md border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-white">Parts</h3>
              <button onClick={addPart} className="flex items-center gap-1 text-sm text-gold hover:underline"><Plus size={14} /> Add</button>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_64px_64px_56px_28px] gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                <span>Label</span><span>W</span><span>H</span><span>Qty</span><span />
              </div>
              {parts.map((p, i) => (
                <div key={i}>
                  <div className="grid grid-cols-[1fr_64px_64px_56px_28px] gap-1.5">
                    <input value={p.label} onChange={(e) => setPart(i, { label: e.target.value })} className={input} />
                    <input type="number" value={p.w} onChange={(e) => setPart(i, { w: +e.target.value })} className={input} />
                    <input type="number" value={p.h} onChange={(e) => setPart(i, { h: +e.target.value })} className={input} />
                    <input type="number" value={p.qty} onChange={(e) => setPart(i, { qty: +e.target.value })} className={input} />
                    <button onClick={() => removePart(i)} className="text-muted-foreground hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                  <label className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <input type="checkbox" checked={!!p.noRotate} onChange={(e) => setPart(i, { noRotate: e.target.checked })} className="h-3 w-3 accent-[hsl(var(--gold))]" />
                    Lock grain (no rotation)
                  </label>
                  {engine === "freeform" && (
                    <div className="mt-1 grid grid-cols-[1fr_64px_64px_56px_28px] gap-1.5">
                      <span className="self-center text-[10px] text-muted-foreground">L-notch (corner cut)</span>
                      <input type="number" placeholder="nW" value={p.notchW ?? ""} onChange={(e) => setPart(i, { notchW: e.target.value ? +e.target.value : undefined })} className={input} />
                      <input type="number" placeholder="nH" value={p.notchH ?? ""} onChange={(e) => setPart(i, { notchH: e.target.value ? +e.target.value : undefined })} className={input} />
                      <select value={p.notchCorner ?? "tr"} onChange={(e) => setPart(i, { notchCorner: e.target.value as any })} className={input}>
                        <option value="tl">tl</option><option value="tr">tr</option><option value="bl">bl</option><option value="br">br</option>
                      </select>
                      <span />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button onClick={run} className="btn-gold flex w-full items-center justify-center gap-2 px-6 py-3"><Play size={16} /> Optimize layout</button>
        </div>

        {/* RESULTS */}
        <div>
          {!result ? (
            <div className="flex h-full min-h-[300px] items-center justify-center rounded-md border border-dashed border-border text-muted-foreground">
              Set your slab, parts (and defects), then click “Optimize layout”.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-md border border-border bg-card p-4">
                <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Engine comparison (lower slabs = better)</div>
                <div className="grid grid-cols-3 gap-2">
                  {comparison.map((c) => {
                    const label = c.engine === "shelf" ? "Fast (shelf)" : c.engine === "maxrects" ? "Best (MaxRects)" : "Free-form";
                    const isBest = c.slabs === bestSlabs;
                    const isActive = c.engine === engine;
                    return (
                      <button
                        key={c.engine}
                        onClick={() => setEngine(c.engine)}
                        className={`rounded-sm border p-3 text-left transition-colors ${isActive ? "border-gold bg-gold/10" : "border-border hover:border-gold/40"}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{label}</span>
                          {isBest && <span className="rounded-sm bg-gold/20 px-1.5 text-[10px] text-gold">best</span>}
                        </div>
                        <div className="mt-1 font-display text-xl font-black text-white">{c.slabs} slab{c.slabs === 1 ? "" : "s"}</div>
                        <div className="text-xs text-muted-foreground">{c.yieldPct.toFixed(1)}% yield</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <Stat label="Slabs" value={String(result.slabsUsed)} />
                <Stat label="Yield" value={`${result.yieldPct.toFixed(1)}%`} highlight />
                <Stat label="Remnants used" value={String(result.remnantsUsed)} />
                <Stat label="Waste" value={`${(result.wasteArea / 144).toFixed(1)} ft²`} />
                <Stat label="Material cost" value={result.cost != null ? `$${result.cost.toFixed(0)}` : "—"} />
              </div>

              {result.unplaced.length > 0 && (
                <div className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
                  {result.unplaced.length} part(s) don&apos;t fit: {result.unplaced.map((u) => `${u.label} (${u.w}×${u.h})`).join(", ")}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button onClick={saveJob} disabled={!!busy} className="btn-outline-gold flex items-center gap-2 px-4 py-2 text-sm">{busy === "job" ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save job</button>
                <button onClick={saveRemnants} disabled={!!busy} className="btn-outline-gold flex items-center gap-2 px-4 py-2 text-sm">{busy === "rem" ? <Loader2 size={14} className="animate-spin" /> : <Boxes size={14} />} Save remnants</button>
                <button onClick={createEstimate} disabled={!!busy} className="btn-outline-gold flex items-center gap-2 px-4 py-2 text-sm">{busy === "quote" ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />} Create estimate</button>
                <button onClick={printCutList} className="btn-outline-gold flex items-center gap-2 px-4 py-2 text-sm"><Printer size={14} /> Print cut list</button>
                {msg && <span className="self-center text-sm text-gold">{msg}</span>}
              </div>

              {result.bins.map((bin, i) => (
                <div key={i} className="rounded-md border border-border bg-card p-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-semibold text-white">{bin.kind === "remnant" ? "Remnant" : "Slab"} {i + 1} <span className="text-xs text-muted-foreground">({bin.w}×{bin.h})</span></span>
                    <span className="text-muted-foreground">{((bin.usedArea / (bin.w * bin.h)) * 100).toFixed(1)}% used</span>
                  </div>
                  <BinSvg bin={bin} defects={bin.kind === "slab" ? defects : []} colorFor={colorFor} />
                </div>
              ))}
            </div>
          )}

          {jobs.length > 0 && (
            <div className="mt-8">
              <h3 className="mb-3 font-semibold text-white">Recent jobs</h3>
              <div className="space-y-2">
                {jobs.slice(0, 6).map((j) => (
                  <button key={j.id} onClick={() => loadJob(j)} className="flex w-full items-center justify-between rounded-md border border-border bg-card px-4 py-2 text-left text-sm transition-colors hover:border-gold/40">
                    <span className="text-white">{j.name ?? "Cut job"} <span className="text-xs text-muted-foreground">· {j.engine} · load ↺</span></span>
                    <span className="text-muted-foreground">{j.slabsUsed} slab(s) · {j.yieldPct.toFixed(0)}%{j.cost != null ? ` · $${j.cost.toFixed(0)}` : ""}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function DimSelect({
  label, value, set, options, prefix = "",
}: {
  label: string; value: number; set: (n: number) => void; options: number[]; prefix?: string;
}) {
  const opts = Array.from(new Set([...options, value].filter((n) => n > 0))).sort((a, b) => a - b);
  return (
    <label className="text-xs text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(e) => {
          if (e.target.value === "custom") {
            const n = Number(window.prompt(`Enter ${label}:`, String(value)));
            if (!isNaN(n) && n > 0) set(n);
          } else {
            set(+e.target.value);
          }
        }}
        className="mt-1 w-full rounded-sm border border-input bg-background px-2 py-1.5 text-sm text-white outline-none focus:border-gold"
      >
        {opts.map((o) => (
          <option key={o} value={o}>{prefix}{o}</option>
        ))}
        <option value="custom">Custom…</option>
      </select>
    </label>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className={`font-display text-2xl font-black ${highlight ? "gold-grad" : "text-white"}`}>{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function DefectEditor({ slabW, slabH, defects, setDefects, imageUrl }: { slabW: number; slabH: number; defects: Rect[]; setDefects: (d: Rect[]) => void; imageUrl?: string | null; }) {
  const ref = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [cur, setCur] = useState<Rect | null>(null);
  const maxW = 320; const scale = maxW / slabW; const W = slabW * scale; const H = slabH * scale;

  function toIn(e: React.MouseEvent) {
    const r = ref.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale };
  }
  return (
    <div className="rounded-md border border-border bg-card p-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold text-white">Defects / no-cut zones</h3>
        {defects.length > 0 && <button onClick={() => setDefects([])} className="text-xs text-muted-foreground hover:text-red-400">Clear</button>}
      </div>
      <p className="mb-2 text-xs text-muted-foreground">Drag on the slab to mark cracks/fissures to avoid.</p>
      <svg
        ref={ref} width="100%" viewBox={`0 0 ${W} ${H}`} style={{ background: "#0e0e10", touchAction: "none" }} className="rounded-sm border border-border"
        onMouseDown={(e) => { const p = toIn(e); setDrag(p); setCur({ x: p.x, y: p.y, w: 0, h: 0 }); }}
        onMouseMove={(e) => { if (!drag) return; const p = toIn(e); setCur({ x: Math.min(drag.x, p.x), y: Math.min(drag.y, p.y), w: Math.abs(p.x - drag.x), h: Math.abs(p.y - drag.y) }); }}
        onMouseUp={() => { if (cur && cur.w > 2 && cur.h > 2) setDefects([...defects, cur]); setDrag(null); setCur(null); }}
        onMouseLeave={() => { setDrag(null); setCur(null); }}
      >
        {imageUrl && <image href={imageUrl} x={0} y={0} width={W} height={H} preserveAspectRatio="xMidYMid slice" opacity={0.7} />}
        <rect x={0} y={0} width={W} height={H} fill="none" stroke="#3a3a40" />
        {defects.map((d, i) => (
          <rect key={i} x={d.x * scale} y={d.y * scale} width={d.w * scale} height={d.h * scale} fill="#ef4444" fillOpacity={0.4} stroke="#ef4444" />
        ))}
        {cur && <rect x={cur.x * scale} y={cur.y * scale} width={cur.w * scale} height={cur.h * scale} fill="#ef4444" fillOpacity={0.3} stroke="#ef4444" strokeDasharray="3" />}
      </svg>
    </div>
  );
}

function BinSvg({ bin, defects, colorFor }: { bin: BinLayout; defects: Rect[]; colorFor: (l: string) => string; }) {
  const maxW = 760; const scale = maxW / bin.w; const W = bin.w * scale; const H = bin.h * scale;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="rounded-sm" style={{ background: "#0e0e10" }}>
      <rect x={0} y={0} width={W} height={H} fill="none" stroke="#3a3a40" />
      {bin.freeRects.map((r, i) => (
        <rect key={`f${i}`} x={r.x * scale} y={r.y * scale} width={r.w * scale} height={r.h * scale} fill="#22c55e" fillOpacity={0.08} stroke="#22c55e" strokeOpacity={0.3} strokeDasharray="3" />
      ))}
      {defects.map((d, i) => (
        <rect key={`d${i}`} x={d.x * scale} y={d.y * scale} width={d.w * scale} height={d.h * scale} fill="#ef4444" fillOpacity={0.35} stroke="#ef4444" />
      ))}
      {bin.placements.map((p, i) => {
        const col = colorFor(p.label);
        const subs = p.parts ?? [{ x: 0, y: 0, w: p.w, h: p.h }];
        return (
          <g key={i}>
            {subs.map((s, j) => (
              <rect key={j} x={(p.x + s.x) * scale} y={(p.y + s.y) * scale} width={s.w * scale} height={s.h * scale} fill={col} fillOpacity={0.85} stroke="#0e0e10" />
            ))}
            {p.w * scale > 46 && p.h * scale > 16 && (
              <text x={p.x * scale + 4} y={p.y * scale + 14} fontSize={11} fill="#1a1306" fontWeight={600}>
                {p.label} {p.rotated ? "↻" : ""}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
