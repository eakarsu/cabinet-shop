"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";

type Settings = {
  companyName: string;
  phone: string;
  email: string;
  address: string;
  hours: string[];
};

export function SettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [form, setForm] = useState({
    companyName: initial.companyName,
    phone: initial.phone,
    email: initial.email,
    address: initial.address,
    hours: initial.hours.join("\n"),
  });
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setOk(false);
    setErr("");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json())?.error || "Failed");
      setOk(true);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  const input =
    "w-full rounded-sm border border-input bg-background px-4 py-2.5 text-sm text-white outline-none focus:border-gold";

  return (
    <form onSubmit={save} className="max-w-xl space-y-4 rounded-md border border-border bg-card p-6">
      {[
        { k: "companyName", label: "Company name" },
        { k: "phone", label: "Phone" },
        { k: "email", label: "Email" },
        { k: "address", label: "Address" },
      ].map((f) => (
        <div key={f.k}>
          <label className="mb-1.5 block text-sm text-muted-foreground">{f.label}</label>
          <input
            value={(form as any)[f.k]}
            onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
            className={input}
          />
        </div>
      ))}
      <div>
        <label className="mb-1.5 block text-sm text-muted-foreground">Hours (one per line)</label>
        <textarea
          rows={3}
          value={form.hours}
          onChange={(e) => setForm({ ...form, hours: e.target.value })}
          className={input}
        />
      </div>
      {err && <p className="text-sm text-red-400">{err}</p>}
      <button disabled={busy} className="btn-gold flex items-center gap-2 px-6 py-2.5 text-sm">
        {busy ? <Loader2 size={14} className="animate-spin" /> : ok ? <Check size={14} /> : null}
        {ok ? "Saved" : "Save settings"}
      </button>
    </form>
  );
}
