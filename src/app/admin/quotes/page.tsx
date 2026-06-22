import { prisma } from "@/lib/db";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ExportCsv } from "@/components/admin/export-csv";
import { EstimatesTable } from "@/components/admin/estimates-table";

export const dynamic = "force-dynamic";

export default async function AdminQuotesPage() {
  const quotes = await prisma.quoteRequest.findMany({ orderBy: { createdAt: "desc" } });
  const serialized = quotes.map((q) => ({
    ...q,
    createdAt: q.createdAt.toISOString(),
  }));

  return (
    <>
      <AdminPageHeader
        title="Estimates"
        subtitle={`${quotes.length} free-estimate requests from the website and AI concierge.`}
        action={
          <ExportCsv
            filename="estimates.csv"
            columns={[
              { key: "name", label: "Name" },
              { key: "email", label: "Email" },
              { key: "phone", label: "Phone" },
              { key: "projectType", label: "Project" },
              { key: "material", label: "Material" },
              { key: "zip", label: "Zip" },
              { key: "source", label: "Source" },
              { key: "status", label: "Status" },
              { key: "createdAt", label: "Received" },
            ]}
            rows={serialized.map((q) => ({
              ...q,
              createdAt: q.createdAt.slice(0, 10),
            }))}
          />
        }
      />
      <div className="p-6 sm:p-8">
        <EstimatesTable quotes={serialized} />
      </div>
    </>
  );
}
