"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  materialId,
  initial = false,
  signedIn = true,
}: {
  materialId: string;
  initial?: boolean;
  signedIn?: boolean;
}) {
  const router = useRouter();
  const [fav, setFav] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!signedIn) {
      router.push("/login?callbackUrl=/account/favorites");
      return;
    }
    setBusy(true);
    const next = !fav;
    setFav(next);
    try {
      const res = await fetch("/api/favorites", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialId }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setFav(!next); // revert
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={cn(
        "inline-flex items-center gap-2 rounded-sm border px-5 py-3.5 text-sm font-semibold transition-colors",
        fav
          ? "border-gold bg-gold/15 text-gold"
          : "border-gold/50 text-gold-bright hover:bg-gold/10"
      )}
    >
      {busy ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Heart size={16} fill={fav ? "currentColor" : "none"} />
      )}
      {fav ? "Saved" : "Save"}
    </button>
  );
}
