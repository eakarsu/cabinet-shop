"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Staff = { id: string; name: string | null; email: string };
type Account = { id: string; name: string; domain: string | null; status: string; ownerId: string | null; version: number; _count: { contacts: number } };
const input = "rounded-sm border border-input bg-background px-3 py-2 text-sm text-white outline-none focus:border-gold";

export function AccountsManager({ accounts, staff }: { accounts: Account[]; staff: Staff[] }) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const response = await fetch("/api/sales/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
    if (!response.ok) setError((await response.json())?.error || "Unable to create account.");
    else { event.currentTarget.reset(); router.refresh(); }
  }

  async function update(account: Account, body: Record<string, unknown>) {
    setError("");
    const response = await fetch(`/api/sales/accounts/${account.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, expectedVersion: account.version }) });
    if (!response.ok) setError((await response.json())?.error || "Unable to update account.");
    else router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={create} className="flex flex-wrap gap-3 rounded-md border border-border bg-card p-5">
        <input name="name" required className={input} placeholder="Account name" aria-label="Account name" />
        <input name="domain" className={input} placeholder="company.example" aria-label="Account domain" />
        <select name="ownerId" className={input} aria-label="Owner"><option value="">Unassigned</option>{staff.map((person) => <option key={person.id} value={person.id}>{person.name || person.email}</option>)}</select>
        <button className="btn-gold px-4 py-2 text-sm">Create account</button>
      </form>
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[720px] text-sm"><thead className="bg-card text-left text-xs uppercase text-muted-foreground"><tr><th className="p-3">Account</th><th className="p-3">Contacts</th><th className="p-3">Owner</th><th className="p-3">Lifecycle</th></tr></thead>
          <tbody className="divide-y divide-border">{accounts.map((account) => <tr key={account.id}><td className="p-3 text-white">{account.name}<div className="text-xs text-muted-foreground">{account.domain || "No domain"}</div></td><td className="p-3 text-muted-foreground">{account._count.contacts}</td><td className="p-3"><select value={account.ownerId || ""} onChange={(event) => update(account, { ownerId: event.target.value })} className={input}><option value="">Unassigned</option>{staff.map((person) => <option key={person.id} value={person.id}>{person.name || person.email}</option>)}</select></td><td className="p-3"><select value={account.status} onChange={(event) => update(account, { status: event.target.value })} className={input}><option value="prospect">prospect</option><option value="qualified">qualified</option><option value="customer">customer</option><option value="dormant">dormant</option></select></td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

