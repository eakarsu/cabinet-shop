import Link from "next/link";
import {
  FileText,
  CalendarClock,
  Gem,
  Images,
  Wrench,
  Star,
  Users,
  HelpCircle,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { AdminPageHeader } from "@/components/admin/page-header";
import {
  LeadsByStatusChart,
  ConsultationsByStatusChart,
} from "@/components/admin/analytics-charts";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const [
    quotes,
    newQuotes,
    consultations,
    upcomingConsults,
    materials,
    projects,
    services,
    testimonials,
    team,
    faqs,
    recentQuotes,
    recentConsults,
  ] = await Promise.all([
    prisma.quoteRequest.count(),
    prisma.quoteRequest.count({ where: { status: "new" } }),
    prisma.consultation.count(),
    prisma.consultation.count({
      where: { status: { in: ["requested", "confirmed"] }, date: { gte: new Date() } },
    }),
    prisma.material.count(),
    prisma.project.count(),
    prisma.service.count(),
    prisma.testimonial.count(),
    prisma.teamMember.count(),
    prisma.faq.count(),
    prisma.quoteRequest.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.consultation.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const [quotesByStatus, consultsByStatus] = await Promise.all([
    prisma.quoteRequest.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.consultation.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const leadChart = quotesByStatus.map((r) => ({ status: r.status, count: r._count._all }));
  const consultChart = consultsByStatus.map((r) => ({ status: r.status, count: r._count._all }));

  const cards = [
    { label: "Estimates", value: quotes, sub: `${newQuotes} new`, href: "/admin/quotes", icon: FileText },
    { label: "Consultations", value: consultations, sub: `${upcomingConsults} upcoming`, href: "/admin/consultations", icon: CalendarClock },
    { label: "Materials", value: materials, sub: "in catalog", href: "/admin/materials", icon: Gem },
    { label: "Gallery", value: projects, sub: "projects", href: "/admin/projects", icon: Images },
    { label: "Services", value: services, sub: "offered", href: "/admin/services", icon: Wrench },
    { label: "Reviews", value: testimonials, sub: "published", href: "/admin/testimonials", icon: Star },
    { label: "Team", value: team, sub: "members", href: "/admin/team", icon: Users },
    { label: "FAQs", value: faqs, sub: "published", href: "/admin/faqs", icon: HelpCircle },
  ];

  return (
    <>
      <AdminPageHeader title="Overview" subtitle="Everything in the Heritage database at a glance." />
      <div className="space-y-8 p-6 sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.label}
                href={c.href}
                className="lift rounded-md border border-border bg-card p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{c.label}</span>
                  <Icon size={18} className="text-gold" />
                </div>
                <div className="mt-3 font-display text-3xl font-black text-white">
                  {c.value}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{c.sub}</div>
              </Link>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <LeadsByStatusChart data={leadChart} />
          <ConsultationsByStatusChart data={consultChart} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-md border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-white">Latest estimates</h2>
              <Link href="/admin/quotes" className="text-sm text-gold hover:underline">
                View all
              </Link>
            </div>
            <ul className="divide-y divide-border">
              {recentQuotes.map((q) => (
                <li key={q.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <div className="text-white">{q.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {q.projectType ?? "—"} · {q.source}
                    </div>
                  </div>
                  <span className="rounded-sm bg-gold/15 px-2 py-0.5 text-xs text-gold">
                    {q.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-md border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-white">Latest consultations</h2>
              <Link href="/admin/consultations" className="text-sm text-gold hover:underline">
                View all
              </Link>
            </div>
            <ul className="divide-y divide-border">
              {recentConsults.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <div className="text-white">{c.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(c.date).toLocaleDateString()} · {c.time}
                    </div>
                  </div>
                  <span className="rounded-sm bg-gold/15 px-2 py-0.5 text-xs text-gold">
                    {c.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
