import { prisma } from "@/lib/db";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ExportCsv } from "@/components/admin/export-csv";
import { ConsultationsTable } from "@/components/admin/consultations-table";

export const dynamic = "force-dynamic";

export default async function AdminConsultationsPage() {
  const consultations = await prisma.consultation.findMany({
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });
  const serialized = consultations.map((c) => ({
    ...c,
    date: c.date.toISOString(),
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <>
      <AdminPageHeader
        title="Consultations"
        subtitle={`${consultations.length} design consultations booked online and via the AI concierge.`}
        action={
          <ExportCsv
            filename="consultations.csv"
            columns={[
              { key: "name", label: "Name" },
              { key: "email", label: "Email" },
              { key: "phone", label: "Phone" },
              { key: "date", label: "Date" },
              { key: "time", label: "Time" },
              { key: "projectType", label: "Project" },
              { key: "material", label: "Material" },
              { key: "source", label: "Source" },
              { key: "status", label: "Status" },
            ]}
            rows={serialized.map((c) => ({ ...c, date: c.date.slice(0, 10) }))}
          />
        }
      />
      <div className="p-6 sm:p-8">
        <ConsultationsTable items={serialized} />
      </div>
    </>
  );
}
