"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";

export function ProfileEditor({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [savingName, setSavingName] = useState(false);
  const [nameOk, setNameOk] = useState(false);
  const [nameErr, setNameErr] = useState("");

  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwOk, setPwOk] = useState(false);
  const [pwErr, setPwErr] = useState("");

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setSavingName(true);
    setNameOk(false);
    setNameErr("");
    try {
      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error((await res.json())?.error || "Failed");
      setNameOk(true);
      router.refresh();
    } catch (e) {
      setNameErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setSavingName(false);
    }
  }

  async function savePw(e: React.FormEvent) {
    e.preventDefault();
    setSavingPw(true);
    setPwOk(false);
    setPwErr("");
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: cur, newPassword: next }),
      });
      if (!res.ok) throw new Error((await res.json())?.error || "Failed");
      setPwOk(true);
      setCur("");
      setNext("");
    } catch (e) {
      setPwErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setSavingPw(false);
    }
  }

  const input =
    "w-full rounded-sm border border-input bg-background px-4 py-2.5 text-sm text-white outline-none focus:border-gold";

  return (
    <div className="grid max-w-3xl gap-6 md:grid-cols-2">
      <form onSubmit={saveName} className="rounded-md border border-border bg-card p-5">
        <h3 className="font-semibold text-white">Edit name</h3>
        <label className="mb-1.5 mt-4 block text-sm text-muted-foreground">Full name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className={input} />
        {nameErr && <p className="mt-2 text-xs text-red-400">{nameErr}</p>}
        <button disabled={savingName} className="btn-gold mt-4 flex items-center gap-2 px-5 py-2.5 text-sm">
          {savingName ? <Loader2 size={14} className="animate-spin" /> : nameOk ? <Check size={14} /> : null}
          {nameOk ? "Saved" : "Save name"}
        </button>
      </form>

      <form onSubmit={savePw} className="rounded-md border border-border bg-card p-5">
        <h3 className="font-semibold text-white">Change password</h3>
        <label className="mb-1.5 mt-4 block text-sm text-muted-foreground">Current password</label>
        <input type="password" value={cur} onChange={(e) => setCur(e.target.value)} className={input} required />
        <label className="mb-1.5 mt-3 block text-sm text-muted-foreground">New password</label>
        <input type="password" value={next} onChange={(e) => setNext(e.target.value)} className={input} required />
        {pwErr && <p className="mt-2 text-xs text-red-400">{pwErr}</p>}
        <button disabled={savingPw} className="btn-gold mt-4 flex items-center gap-2 px-5 py-2.5 text-sm">
          {savingPw ? <Loader2 size={14} className="animate-spin" /> : pwOk ? <Check size={14} /> : null}
          {pwOk ? "Updated" : "Update password"}
        </button>
      </form>
    </div>
  );
}
