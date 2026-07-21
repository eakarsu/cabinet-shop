"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, Trash2, Ban } from "lucide-react";

type Consultation = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  date: string;
  time: string;
  projectType: string | null;
  material: string | null;
  address: string | null;
  source: string;
  status: string;
  version: number;
};

const STATUSES = ["requested", "confirmed", "completed", "cancelled"];
const SLOTS = ["09:00", "10:30", "13:00", "14:30", "16:00"];
const PAGE_SIZE = 10;
const input =
  "w-full rounded-sm border border-input bg-background px-3 py-2 text-sm text-white outline-none focus:border-gold";

export function ConsultationsTable({ items }: { items: Consultation[] }) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Consultation | null>(null);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter((x) =>
      [x.name, x.email, x.phone, x.projectType, x.material, x.status, x.source]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(t))
    );
  }, [q, items]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const rows = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 rounded-sm border border-border bg-card px-3 py-2">
        <Search size={16} className="text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(0); }}
          placeholder="Search by name, phone, project, status…"
          className="w-full bg-transparent text-sm text-white outline-none"
        />
        <span className="shrink-0 text-xs text-muted-foreground">{filtered.length} result(s)</span>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-card text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((c) => (
              <tr key={c.id} onClick={() => setSelected(c)} className="cursor-pointer transition-colors hover:bg-gold/5">
                <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  <div>{c.email ?? "—"}</div>
                  <div className="text-xs">{c.phone}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(c.date).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.time}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.projectType ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className="rounded-sm bg-secondary px-2 py-0.5 text-xs text-stone-200">{c.source}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-sm bg-gold/15 px-2 py-0.5 text-xs text-gold">{c.status}</span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No matching consultations.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-3 text-sm">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={current === 0} className="btn-outline-gold px-3 py-1.5 text-xs disabled:opacity-40">Prev</button>
          <span className="text-muted-foreground">Page {current + 1} of {pages}</span>
          <button onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} disabled={current >= pages - 1} className="btn-outline-gold px-3 py-1.5 text-xs disabled:opacity-40">Next</button>
        </div>
      )}

      {selected && <ConsultationModal c={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function ConsultationModal({ c, onClose }: { c: Consultation; onClose: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({
    date: c.date.slice(0, 10),
    time: c.time,
    projectType: c.projectType ?? "",
    status: c.status,
  });

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/consultations/${c.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, expectedVersion: c.version }),
      });
      if (!res.ok) throw new Error();
      onClose(); router.refresh();
    } finally { setBusy(false); }
  }
  async function remove() {
    if (!confirm("Cancel this consultation? Its audit history will be retained.")) return;
    await patch({ status: "cancelled" });
  }

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm text-white">{value || "—"}</div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="font-display text-2xl font-bold text-white">{c.name}</h3>
            <p className="text-sm text-muted-foreground">{c.email ?? "—"} · {c.phone}</p>
            {c.address && <p className="mt-1 text-xs text-muted-foreground">{c.address}</p>}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-gold"><X size={20} /></button>
        </div>

        {!edit ? (
          <div className="grid grid-cols-2 gap-4">
            <Row label="Date" value={new Date(c.date).toLocaleDateString()} />
            <Row label="Time" value={form.time} />
            <Row label="Project type" value={form.projectType} />
            <Row label="Status" value={form.status} />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={input} />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Time</label>
                <select value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className={input}>
                  {SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Project type</label>
              <input value={form.projectType} onChange={(e) => setForm({ ...form, projectType: e.target.value })} className={input} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={input}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <button onClick={remove} className="flex items-center gap-2 rounded-sm border border-border px-4 py-2.5 text-sm text-muted-foreground hover:text-red-400">
            <Trash2 size={15} /> Cancel booking
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-outline-gold px-5 py-2.5 text-sm">Cancel</button>
            {!edit ? (
              <>
                <button onClick={() => patch({ status: "cancelled" })} disabled={busy} className="flex items-center gap-1.5 rounded-sm border border-border px-4 py-2.5 text-sm text-muted-foreground hover:text-amber-400">
                  <Ban size={15} /> Cancel appt
                </button>
                <button onClick={() => setEdit(true)} className="btn-gold px-6 py-2.5 text-sm">Edit</button>
              </>
            ) : (
              <button onClick={() => patch(form)} disabled={busy} className="btn-gold flex items-center gap-2 px-6 py-2.5 text-sm">
                {busy && <Loader2 size={14} className="animate-spin" />} Update
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
