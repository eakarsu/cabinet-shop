"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { COMPANY, NAV } from "@/lib/site";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [sub, setSub] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close on route change
  useEffect(() => {
    setOpen(false);
    setSub(null);
  }, [pathname]);

  // Lock body scroll + close on Escape while the overlay is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const Logo = (
    <Link href="/" className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-gold font-display text-lg font-black text-primary-foreground">
        H
      </span>
      <span className="leading-tight">
        <span className="block font-bold tracking-wide text-white">HERITAGE</span>
        <span className="block text-[10px] tracking-[0.3em] text-gold">
          CABINET &amp; STONE
        </span>
      </span>
    </Link>
  );

  return (
    <>
      {/* ===== Top bar ===== */}
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b transition-colors",
          scrolled || open
            ? "border-gold/25 bg-[hsl(240_7%_5%/0.95)] backdrop-blur"
            : "border-transparent"
        )}
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          {Logo}
          <div className="flex items-center gap-6">
            <a
              href={COMPANY.phoneHref}
              className="hidden text-sm text-muted-foreground transition-colors hover:text-gold sm:block"
            >
              {COMPANY.phone}
            </a>
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              className="flex items-center gap-2 text-white transition-colors hover:text-gold"
            >
              <span className="hidden text-sm font-medium tracking-wide sm:block">
                {open ? "Close" : "Menu"}
              </span>
              {open ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
      </header>

      {/* ===== Full-screen overlay menu ===== */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-[hsl(240_8%_4%/0.98)] backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <nav className="flex h-full flex-col items-center justify-center overflow-y-auto px-5 py-24">
          <ul className="w-full max-w-xl space-y-1 text-center">
            {NAV.map((item) => {
              const active = pathname === item.href;
              const expanded = sub === item.label;
              return (
                <li key={item.href}>
                  {/* Active row gets a horizontal gradient highlight bar */}
                  <div
                    className={cn(
                      "relative flex items-center justify-center rounded-sm",
                      active &&
                        "bg-gradient-to-r from-transparent via-gold/25 to-transparent"
                    )}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        "py-3 font-display text-2xl transition-colors sm:text-3xl",
                        active ? "text-white" : "text-stone-300 hover:text-gold"
                      )}
                    >
                      {item.label}
                    </Link>
                    {item.children && (
                      <button
                        onClick={() => setSub(expanded ? null : item.label)}
                        aria-label={`Toggle ${item.label} submenu`}
                        className="ml-2 text-gold"
                      >
                        <ChevronDown
                          size={20}
                          className={cn(
                            "transition-transform",
                            expanded && "rotate-180"
                          )}
                        />
                      </button>
                    )}
                  </div>

                  {/* Submenu */}
                  {item.children && expanded && (
                    <ul className="mb-3 mt-1 space-y-1">
                      {item.children.map((c) => (
                        <li key={c.href}>
                          <Link
                            href={c.href}
                            className="block py-1.5 text-base text-muted-foreground transition-colors hover:text-gold"
                          >
                            {c.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Actions */}
          <div className="mt-10 flex flex-col items-center gap-4">
            <Link
              href="/login"
              className="text-sm tracking-wide text-muted-foreground transition-colors hover:text-gold"
            >
              Sign in
            </Link>
            <Link href="/contact" className="btn-gold px-8 py-3.5">
              Free Estimate
            </Link>
            <a
              href={COMPANY.phoneHref}
              className="text-sm text-muted-foreground transition-colors hover:text-gold sm:hidden"
            >
              {COMPANY.phone}
            </a>
          </div>
        </nav>
      </div>
    </>
  );
}
