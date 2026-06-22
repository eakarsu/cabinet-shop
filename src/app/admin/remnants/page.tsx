"use client";

import { useEffect, useState } from "react";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";

type Remnant = { id: string; materialId: string | null; label: string | null; w: number; h: number; createdAt: string };
type Material = { id: string; name: string };

const input = "rounded-sm border border-input bg-background px-2 py-1.5 text-sm text-white outline-none focus:border-gold";

export default function RemnantsPage() {
  const [remnants, setRemnants] = useState<Remnant[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [form, setForm] = useState({ materialId: "", label: "Offcut", w: 24, h: 12 });
  const [busy, setBusy] = useState(false);

  function load() {
    fetch("/api/remnants?all=1").then((r) => r.json()).then(setRemnants).catch(() => {});
  }
  useEffect(() => {
    load();
    fetch("/api/materials").then((r) => r.json()).then(setMaterials).catch(() => {});
  }, []);

  async function add() {
    setBusy(true);
    try {
      await fetch("/api/remnants", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remnants: [{ ...form, materialId: form.materialId || null }] }),
      });
      load();
    } finally { setBusy(false); }
  }
  async function remove(id: string) {
    await fetch(`/api/remnants?id=${id}`, { method: "DELETE" });
    setRemnants((rs) => rs.filter((r) => r.id !== id));
  }

  const matName = (id: string | null) => materials.find((m) => m.id === id)?.name ?? "—";

  return (
    <>
      <AdminPageHeader title="Remnants" subtitle={`${remnants.length} leftover piece(s) — reusable as stock in the Cut Optimizer.`} />
      <div className="space-y-6 p-6 sm:p-8">
        <div className="flex flex-wrap items-end gap-2 rounded-md border border-border bg-card p-4">
          <label className="text-xs text-muted-foreground">Material
            <select value={form.materialId} onChange={(e) => setForm({ ...form, materialId: e.target.value })} className={`mt-1 block w-44 ${input}`}>
              <option value="">— Any —</option>
              {materials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">Label<input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className={`mt-1 block ${input}`} /></label>
          <label className="text-xs text-muted-foreground">W<input type="number" value={form.w} onChange={(e) => setForm({ ...form, w: +e.target.value })} className={`mt-1 block w-20 ${input}`} /></label>
          <label className="text-xs text-muted-foreground">H<input type="number" value={form.h} onChange={(e) => setForm({ ...form, h: +e.target.value })} className={`mt-1 block w-20 ${input}`} /></label>
          <button onClick={add} disabled={busy} className="btn-gold flex items-center gap-2 px-4 py-2 text-sm">{busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add remnant</button>
        </div>

        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-card text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="px-4 py-3">Label</th><th className="px-4 py-3">Material</th><th className="px-4 py-3">Size (in)</th><th className="px-4 py-3">Area</th><th className="px-4 py-3">Added</th><th className="px-4 py-3" /></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {remnants.map((r) => (
                <tr key={r.id} className="hover:bg-card/50">
                  <td className="px-4 py-3 text-white">{r.label ?? "Offcut"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{matName(r.materialId)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.w} × {r.h}</td>
                  <td className="px-4 py-3 text-muted-foreground">{(r.w * r.h / 144).toFixed(1)} ft²</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><button onClick={() => remove(r.id)} className="text-muted-foreground hover:text-red-400"><Trash2 size={15} /></button></td>
                </tr>
              ))}
              {remnants.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No remnants yet. Save them from the Cut Optimizer.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
