"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  CalendarClock,
  Gem,
  Heart,
  UserCircle,
  ExternalLink,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard },
  { href: "/account/estimates", label: "My Estimates", icon: FileText },
  { href: "/account/consultations", label: "My Consultations", icon: CalendarClock },
  { href: "/account/materials", label: "Browse Materials", icon: Gem },
  { href: "/account/favorites", label: "Saved Materials", icon: Heart },
  { href: "/account/profile", label: "Profile", icon: UserCircle },
];

function NavContent({ pathname }: { pathname: string }) {
  return (
    <>
      <Link href="/account" className="flex items-center gap-3 border-b border-border px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-gold font-display font-black text-primary-foreground">
          H
        </span>
        <div className="leading-tight">
          <div className="text-sm font-bold text-white">Heritage</div>
          <div className="text-[10px] tracking-[0.25em] text-gold">MY ACCOUNT</div>
        </div>
      </Link>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {LINKS.map((l) => {
          const active = pathname === l.href;
          const Icon = l.icon;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors",
                active ? "bg-gold/15 text-gold" : "text-muted-foreground hover:bg-card hover:text-white"
              )}
            >
              <Icon size={18} />
              {l.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-card hover:text-white"
        >
          <ExternalLink size={18} /> View site
        </Link>
      </div>
    </>
  );
}

export function AccountSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-[hsl(240_7%_5%)] md:flex">
        <NavContent pathname={pathname} />
      </aside>

      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="fixed left-4 top-3.5 z-40 rounded-sm border border-border bg-card p-2 text-white md:hidden"
      >
        <Menu size={20} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <aside
            className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-border bg-[hsl(240_7%_5%)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-4 text-muted-foreground hover:text-gold"
            >
              <X size={20} />
            </button>
            <NavContent pathname={pathname} />
          </aside>
        </div>
      )}
    </>
  );
}
