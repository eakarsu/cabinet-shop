"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";

export type Field = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "checkbox" | "select";
  options?: string[];
  required?: boolean;
  placeholder?: string;
};

type Item = Record<string, any>;

export function EntityManager({
  endpoint,
  items,
  fields,
  titleKey,
  subtitleKey,
  colorKey,
  noun,
}: {
  endpoint: string;
  items: Item[];
  fields: Field[];
  titleKey: string;
  subtitleKey?: string;
  colorKey?: string;
  noun: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Item | null>(null);
  const [creating, setCreating] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [form, setForm] = useState<Item>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function openCreate() {
    setForm({});
    setCreating(true);
    setEditing(null);
    setReadOnly(false);
    setError("");
  }
  function openEdit(item: Item) {
    const f: Item = {};
    for (const fld of fields) {
      const v = item[fld.name];
      f[fld.name] = Array.isArray(v) ? v.join(", ") : v ?? "";
    }
    setForm(f);
    setEditing(item);
    setCreating(false);
    setReadOnly(true); // open in view mode; user clicks Edit to change
    setError("");
  }
  function close() {
    setCreating(false);
    setEditing(null);
  }

  async function save() {
    setBusy(true);
    setError("");
    try {
      const url = editing ? `${endpoint}/${editing.id}` : endpoint;
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || "Save failed");
      }
      close();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: Item) {
    if (!confirm(`Delete this ${noun}? This cannot be undone.`)) return;
    await fetch(`${endpoint}/${item.id}`, { method: "DELETE" });
    router.refresh();
  }

  const showModal = creating || !!editing;

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <button onClick={openCreate} className="btn-gold flex items-center gap-2 px-5 py-2.5 text-sm">
          <Plus size={16} /> Add {noun}
        </button>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => openEdit(item)}
            className="flex cursor-pointer items-center justify-between gap-4 rounded-md border border-border bg-card p-4 transition-colors hover:bg-gold/5"
          >
            <div className="flex min-w-0 items-center gap-3">
              {colorKey && item[colorKey] && (
                <span className={`h-10 w-14 shrink-0 rounded-sm bg-gradient-to-br ${item[colorKey]}`} />
              )}
              <div className="min-w-0">
                <div className="truncate font-medium text-white">{item[titleKey]}</div>
                {subtitleKey && item[subtitleKey] && (
                  <div className="truncate text-xs text-muted-foreground">{item[subtitleKey]}</div>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); openEdit(item); }}
                className="rounded-sm border border-border p-2 text-muted-foreground hover:text-gold"
                aria-label="Edit"
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); remove(item); }}
                className="rounded-sm border border-border p-2 text-muted-foreground hover:text-red-400"
                aria-label="Delete"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">No {noun}s yet.</p>
        )}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"
          onClick={close}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-xl font-bold text-white">
                {!editing ? `Add ${noun}` : readOnly ? noun.charAt(0).toUpperCase() + noun.slice(1) : `Edit ${noun}`}
              </h3>
              <button onClick={close} aria-label="Close" className="text-muted-foreground hover:text-gold">
                <X size={20} />
              </button>
            </div>

            {readOnly ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {fields.map((f) => (
                    <div key={f.name} className={f.type === "textarea" ? "col-span-2" : ""}>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">{f.label}</div>
                      <div className="mt-0.5 text-sm text-white">
                        {f.type === "checkbox"
                          ? form[f.name] ? "Yes" : "No"
                          : (form[f.name] ?? "") === "" ? "—" : String(form[f.name])}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={close} className="btn-outline-gold px-6 py-2.5 text-sm">Cancel</button>
                  <button onClick={() => setReadOnly(false)} className="btn-gold px-6 py-2.5 text-sm">Edit</button>
                </div>
              </div>
            ) : (
            <div className="space-y-4">
              {fields.map((f) => (
                <div key={f.name}>
                  <label className="mb-1.5 block text-sm text-muted-foreground">
                    {f.label}
                    {f.required && <span className="text-gold"> *</span>}
                  </label>
                  {f.type === "textarea" ? (
                    <textarea
                      rows={3}
                      value={form[f.name] ?? ""}
                      placeholder={f.placeholder}
                      onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                      className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm text-white outline-none focus:border-gold"
                    />
                  ) : f.type === "select" ? (
                    <select
                      value={form[f.name] ?? ""}
                      onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                      className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm text-white outline-none focus:border-gold"
                    >
                      <option value="">—</option>
                      {f.options?.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  ) : f.type === "checkbox" ? (
                    <input
                      type="checkbox"
                      checked={!!form[f.name]}
                      onChange={(e) => setForm({ ...form, [f.name]: e.target.checked })}
                      className="h-5 w-5 accent-[hsl(var(--gold))]"
                    />
                  ) : (
                    <input
                      type={f.type === "number" ? "number" : "text"}
                      value={form[f.name] ?? ""}
                      placeholder={f.placeholder}
                      onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                      className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm text-white outline-none focus:border-gold"
                    />
                  )}
                </div>
              ))}

              {error && <p className="text-sm text-red-400">{error}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={close} className="btn-outline-gold px-6 py-2.5 text-sm">
                  Cancel
                </button>
                <button
                  onClick={save}
                  disabled={busy}
                  className="btn-gold flex items-center gap-2 px-6 py-2.5 text-sm"
                >
                  {busy && <Loader2 size={15} className="animate-spin" />}
                  {editing ? "Update" : `Create ${noun}`}
                </button>
              </div>
            </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
