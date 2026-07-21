import { prisma } from "@/lib/db";
import { conversionMetrics } from "@/lib/sales-workflow";
import { AdminPageHeader } from "@/components/admin/page-header";
import { OperationsPanel } from "@/components/admin/operations-panel";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  const [metrics, outreach, integrations, overduePrivacy] = await Promise.all([
    conversionMetrics(),
    prisma.outreachMessage.findMany({ where: { status: "pending_review" }, include: { createdBy: { select: { name: true, email: true } } }, orderBy: { createdAt: "asc" } }),
    prisma.integrationEndpoint.findMany({ include: { events: { where: { status: { in: ["pending", "retry", "failed"] } }, select: { status: true } } }, orderBy: { category: "asc" } }),
    prisma.privacyRequest.count({ where: { status: { not: "completed" }, dueAt: { lt: new Date() } } }),
  ]);
  return (
    <>
      <AdminPageHeader title="Sales Controls" subtitle="Conversion, data quality, consent review, connector health, and privacy deadlines." />
      <div className="space-y-6 p-6 sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Conversion", `${metrics.conversionRate}%`],
            ["Suppressed identities", metrics.dataQuality.suppressed],
            ["Failed sync events", metrics.dataQuality.failedSync],
            ["Overdue privacy requests", overduePrivacy],
          ].map(([label, value]) => <div key={label} className="rounded-md border border-border bg-card p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 font-display text-3xl font-black text-white">{value}</p></div>)}
        </div>
        <OperationsPanel outreach={outreach.map((item) => ({ id: item.id, channel: item.channel, subject: item.subject, body: item.body, status: item.status, createdBy: item.createdBy }))} />
        <section className="rounded-md border border-border bg-card p-5">
          <h2 className="font-semibold text-white">Connector health</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {integrations.map((connector) => <div key={connector.id} className="rounded-sm border border-border bg-background p-4"><div className="flex justify-between"><span className="text-white">{connector.name}</span><span className={connector.enabled ? "text-emerald-400" : "text-muted-foreground"}>{connector.enabled ? "enabled" : "disabled"}</span></div><p className="mt-1 text-xs text-muted-foreground">{connector.category} · {connector.direction} · {connector.events.length} pending/retry/failed</p></div>)}
          </div>
        </section>
      </div>
    </>
  );
}

