import Link from "next/link";
import { COMPANY, NAV } from "@/lib/site";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-[hsl(240_7%_5%)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-gold font-display font-black text-primary-foreground">
              H
            </span>
            <span className="font-bold tracking-wide text-white">HERITAGE</span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Custom cabinetry &amp; natural stone, fabricated and installed since{" "}
            {COMPANY.established}.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-gold">
            Explore
          </h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {NAV.filter((n) => n.href !== "/").map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="hover:text-gold">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-gold">
            Contact
          </h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>
              <a href={COMPANY.phoneHref} className="hover:text-gold">
                {COMPANY.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${COMPANY.email}`} className="hover:text-gold">
                {COMPANY.email}
              </a>
            </li>
            <li>{COMPANY.address}</li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-gold">
            Showroom Hours
          </h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {COMPANY.hours.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-2 border-t border-border py-6 text-center text-xs text-muted-foreground sm:flex-row sm:gap-4">
        <span>© {year} {COMPANY.name}. All rights reserved.</span>
        <Link href="/admin" className="hover:text-gold">
          Staff Admin
        </Link>
      </div>
    </footer>
  );
}
