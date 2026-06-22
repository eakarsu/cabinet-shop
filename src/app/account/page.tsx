import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { FileText, CalendarClock, Gem, Images, Phone, ArrowRight } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { COMPANY } from "@/lib/site";
import { AiDesignAssistant } from "@/components/account/ai-design-assistant";

export const dynamic = "force-dynamic";

export default async function AccountDashboard() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? "";
  const [quotes, consultations, featured] = await Promise.all([
    prisma.quoteRequest.findMany({ where: { email }, orderBy: { createdAt: "desc" } }),
    prisma.consultation.findMany({ where: { email }, orderBy: { date: "asc" } }),
    prisma.material.findMany({ where: { featured: true }, orderBy: { order: "asc" }, take: 3 }),
  ]);

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const upcoming = consultations.filter(
    (c) => new Date(c.date) >= new Date() && c.status !== "cancelled"
  );
  const nextConsult = upcoming[0];
  const openQuotes = quotes.filter((q) => !["won", "lost"].includes(q.status)).length;

  const actions = [
    { href: "/materials", label: "Browse materials", icon: Gem },
    { href: "/gallery", label: "View gallery", icon: Images },
    { href: "/contact", label: "Book consultation", icon: CalendarClock },
    { href: "/contact", label: "Request estimate", icon: FileText },
  ];

  return (
    <div className="space-y-10 p-6 sm:p-8">
      {/* Welcome */}
      <div>
        <p className="eyebrow mb-2">Welcome back</p>
        <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
          Hi {firstName}, <span className="gold-grad">let&apos;s build something.</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          {nextConsult
            ? `Your next consultation is ${new Date(nextConsult.date).toLocaleDateString(
                undefined,
                { weekday: "long", month: "long", day: "numeric" }
              )} at ${nextConsult.time}.`
            : "Book a free consultation or request an estimate to get started."}
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.label}
              href={a.href}
              className="lift flex items-center gap-3 rounded-md border border-border bg-card p-4 text-sm font-medium text-white"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-gold/15 text-gold">
                <Icon size={18} />
              </span>
              {a.label}
            </Link>
          );
        })}
      </div>

      {/* AI design assistant */}
      <AiDesignAssistant />

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Open estimates" value={openQuotes} total={quotes.length} href="/account/estimates" />
        <SummaryCard label="Upcoming consultations" value={upcoming.length} total={consultations.length} href="/account/consultations" />
        <div className="rounded-md border border-gold/30 bg-gold/5 p-5">
          <p className="text-sm text-muted-foreground">Need a hand?</p>
          <a href={COMPANY.phoneHref} className="mt-2 flex items-center gap-2 font-display text-xl font-bold text-white hover:text-gold">
            <Phone size={18} className="text-gold" /> {COMPANY.phone}
          </a>
        </div>
      </div>

      {/* Recent estimates */}
      <section>
        <SectionHeader title="Recent estimates" href="/account/estimates" />
        {quotes.length === 0 ? (
          <Empty text="You haven't requested an estimate yet." cta={{ href: "/contact", label: "Request a free estimate" }} />
        ) : (
          <div className="space-y-3">
            {quotes.slice(0, 3).map((q) => (
              <Row
                key={q.id}
                title={q.projectType ?? "Estimate request"}
                sub={`${q.material ? q.material + " · " : ""}Requested ${new Date(q.createdAt).toLocaleDateString()}`}
                status={q.status}
              />
            ))}
          </div>
        )}
      </section>

      {/* Recent consultations */}
      <section>
        <SectionHeader title="Upcoming consultations" href="/account/consultations" />
        {consultations.length === 0 ? (
          <Empty text="No consultations booked yet." cta={{ href: "/contact", label: "Book a consultation" }} />
        ) : (
          <div className="space-y-3">
            {consultations.slice(0, 3).map((c) => (
              <Row
                key={c.id}
                title={`${new Date(c.date).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} at ${c.time}`}
                sub={c.projectType ?? "Design consultation"}
                status={c.status}
              />
            ))}
          </div>
        )}
      </section>

      {/* Recommended materials */}
      <section>
        <SectionHeader title="Recommended for you" href="/account/materials" />
        <div className="grid gap-6 md:grid-cols-3">
          {featured.map((m) => (
            <div key={m.id} className="lift overflow-hidden rounded-md border border-border bg-card">
              <div className={`h-40 bg-gradient-to-br ${m.swatch}`} />
              <div className="p-5">
                <p className="eyebrow mb-1">{m.category}</p>
                <h3 className="text-lg font-bold text-white">{m.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{m.blurb}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ label, value, total, href }: { label: string; value: number; total: number; href: string }) {
  return (
    <Link href={href} className="lift rounded-md border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-2 font-display text-3xl font-black text-white">
        {value}
        <span className="ml-2 text-sm font-normal text-muted-foreground">of {total}</span>
      </div>
    </Link>
  );
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <Link href={href} className="flex items-center gap-1 text-sm text-gold hover:underline">
        View all <ArrowRight size={14} />
      </Link>
    </div>
  );
}

function Row({ title, sub, status }: { title: string; sub: string; status: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card p-5">
      <div>
        <div className="font-medium text-white">{title}</div>
        <div className="text-sm text-muted-foreground">{sub}</div>
      </div>
      <span className="rounded-sm bg-gold/15 px-3 py-1 text-xs text-gold">{status}</span>
    </div>
  );
}

function Empty({ text, cta }: { text: string; cta: { href: string; label: string } }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-card p-8 text-center">
      <p className="text-muted-foreground">{text}</p>
      <Link href={cta.href} className="btn-gold mt-4 inline-block px-6 py-2.5 text-sm">
        {cta.label}
      </Link>
    </div>
  );
}
