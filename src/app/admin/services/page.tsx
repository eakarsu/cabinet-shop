import { prisma } from "@/lib/db";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EntityManager, type Field } from "@/components/admin/entity-manager";

export const dynamic = "force-dynamic";

const FIELDS: Field[] = [
  { name: "title", label: "Title", required: true },
  { name: "description", label: "Description", type: "textarea" },
  { name: "icon", label: "Lucide icon name", placeholder: "Hammer, Ruler, Sparkles…" },
];

export default async function AdminServicesPage() {
  const services = await prisma.service.findMany({ orderBy: { order: "asc" } });

  return (
    <>
      <AdminPageHeader title="Services" subtitle={`${services.length} services — add, edit, or remove.`} />
      <div className="p-6 sm:p-8">
        <EntityManager
          endpoint="/api/services"
          items={services}
          fields={FIELDS}
          titleKey="title"
          subtitleKey="description"
          noun="service"
        />
      </div>
    </>
  );
}
