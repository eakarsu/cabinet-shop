"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function UserMenu({
  name,
  email,
}: {
  name?: string | null;
  email?: string | null;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="text-right">
        <div className="font-medium text-white">{name ?? "Staff"}</div>
        <div className="text-xs text-muted-foreground">{email}</div>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="btn-outline-gold flex items-center gap-2 px-3 py-2 text-xs"
      >
        <LogOut size={14} /> Sign out
      </button>
    </div>
  );
}
