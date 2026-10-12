import { prisma } from "@/lib/db";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AIReportHistory } from "@/components/AIReportHistory";

export const dynamic = "force-dynamic";

export default async function AIReportsPage() {
  const reports = await prisma.aiResult.findMany({ where: { result: { not: null } }, select: { id: true, feature: true, result: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 50 });
  return <><AdminPageHeader title="AI reports" subtitle="Saved provider responses for review." /><div className="p-6 sm:p-8"><AIReportHistory reports={reports} /></div></>;
}
