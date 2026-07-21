"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, ShieldCheck } from "lucide-react";
import { AiLeadAssistant } from "@/components/admin/ai-lead-assistant";

type Quote = {
  id: string;
  name: string;
  email: string;
  phone: string;
  projectType: string | null;
  material: string | null;
  zip: string | null;
  message: string | null;
  adminNotes: string | null;
  source: string;
  status: string;
  createdAt: string;
  version: number;
  ownerId: string | null;
  approvalState: string;
  handoffState: string;
  contactId: string | null;
};

type Staff = { id: string; name: string | null; email: string };

const STATUSES = ["new", "qualified", "assigned", "contacted", "consultation_scheduled", "proposal", "approval_pending", "won", "lost"];
const PAGE_SIZE = 10;
const input =
  "w-full rounded-sm border border-input bg-background px-3 py-2 text-sm text-white outline-none focus:border-gold";

export function EstimatesTable({ quotes, staff }: { quotes: Quote[]; staff: Staff[] }) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Quote | null>(null);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return quotes;
    return quotes.filter((x) =>
      [x.name, x.email, x.phone, x.projectType, x.material, x.status, x.source]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(t))
    );
  }, [q, quotes]);

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
          placeholder="Search by name, email, project, status…"
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
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Material</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Received</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((x) => (
              <tr
                key={x.id}
                onClick={() => setSelected(x)}
                className="cursor-pointer transition-colors hover:bg-gold/5"
              >
                <td className="px-4 py-3 font-medium text-white">{x.name}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  <div>{x.email}</div>
                  <div className="text-xs">{x.phone}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {x.projectType ?? "—"}{x.zip ? <span className="text-xs"> · {x.zip}</span> : null}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{x.material ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className="rounded-sm bg-secondary px-2 py-0.5 text-xs text-stone-200">{x.source}</span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(x.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <span className="rounded-sm bg-gold/15 px-2 py-0.5 text-xs text-gold">{x.status}</span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No matching estimates.</td></tr>
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

      {selected && <EstimateModal quote={selected} staff={staff} onClose={() => setSelected(null)} />}
    </div>
  );
}

function EstimateModal({ quote, staff, onClose }: { quote: Quote; staff: Staff[]; onClose: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({
    status: quote.status,
    projectType: quote.projectType ?? "",
    material: quote.material ?? "",
    message: quote.message ?? "",
    adminNotes: quote.adminNotes ?? "",
  });
  const [ownerId, setOwnerId] = useState(quote.ownerId ?? "");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  async function update() {
    setBusy(true);
    setError("");
    try {
      const body = form.status === quote.status
        ? { projectType: form.projectType, material: form.material, message: form.message, adminNotes: form.adminNotes, expectedVersion: quote.version }
        : { status: form.status, reason, expectedVersion: quote.version };
      const res = await fetch(`/api/quotes/${quote.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json())?.error || "Update failed.");
      onClose(); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Update failed."); }
    finally { setBusy(false); }
  }
  async function workflow(body: Record<string, unknown>) {
    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/quotes/${quote.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, expectedVersion: quote.version }) });
      if (!res.ok) throw new Error((await res.json())?.error || "Workflow update failed.");
      onClose(); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Workflow update failed."); }
    finally { setBusy(false); }
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
            <h3 className="font-display text-2xl font-bold text-white">{quote.name}</h3>
            <p className="text-sm text-muted-foreground">{quote.email} · {quote.phone}</p>
            <p className="mt-1 text-xs text-muted-foreground">Received {new Date(quote.createdAt).toLocaleString()} · via {quote.source}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-gold"><X size={20} /></button>
        </div>

        {!edit ? (
          <div className="grid grid-cols-2 gap-4">
            <Row label="Status" value={form.status} />
            <Row label="Approval" value={quote.approvalState} />
            <Row label="Handoff" value={quote.handoffState} />
            <Row label="Owner" value={staff.find((person) => person.id === quote.ownerId)?.name || staff.find((person) => person.id === quote.ownerId)?.email || "Unassigned"} />
            <Row label="Project type" value={form.projectType} />
            <Row label="Material" value={form.material} />
            <Row label="Zip" value={quote.zip ?? ""} />
            <div className="col-span-2"><Row label="Customer message" value={form.message} /></div>
            <div className="col-span-2"><Row label="Internal notes" value={form.adminNotes} /></div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={input}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {form.status === "lost" && <input value={reason} onChange={(e) => setReason(e.target.value)} className={`${input} mt-2`} placeholder="Required loss reason" />}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Project type</label>
                <input value={form.projectType} onChange={(e) => setForm({ ...form, projectType: e.target.value })} className={input} />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Material</label>
                <input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} className={input} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Customer message</label>
              <textarea rows={2} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={input} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Internal notes</label>
              <textarea rows={2} value={form.adminNotes} onChange={(e) => setForm({ ...form, adminNotes: e.target.value })} className={input} />
            </div>
          </div>
        )}

        <div className="mt-4 border-t border-border pt-3">
          <AiLeadAssistant lead={quote} />
        </div>

        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ownership and approval</p>
          <div className="flex gap-2">
            <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className={input}>
              <option value="">Choose active owner</option>
              {staff.map((person) => <option key={person.id} value={person.id}>{person.name || person.email}</option>)}
            </select>
            <button disabled={busy || !ownerId} onClick={() => workflow({ ownerId })} className="btn-outline-gold px-3 text-xs">Assign</button>
            <button disabled={busy || !["proposal", "approval_pending"].includes(quote.status)} onClick={() => workflow({ approvalDecision: "approve" })} className="btn-outline-gold flex items-center gap-1 px-3 text-xs"><ShieldCheck size={14} /> Approve</button>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Leads are retained for consent and audit history.</span>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-outline-gold px-5 py-2.5 text-sm">Cancel</button>
            {!edit ? (
              <button onClick={() => setEdit(true)} className="btn-gold px-6 py-2.5 text-sm">Edit</button>
            ) : (
              <button onClick={update} disabled={busy} className="btn-gold flex items-center gap-2 px-6 py-2.5 text-sm">
                {busy && <Loader2 size={14} className="animate-spin" />} Update
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
