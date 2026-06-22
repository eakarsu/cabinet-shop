import { prisma } from "@/lib/db";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EntityManager, type Field } from "@/components/admin/entity-manager";

export const dynamic = "force-dynamic";

const FIELDS: Field[] = [
  { name: "title", label: "Title", required: true },
  { name: "tag", label: "Material tag", type: "select", options: ["Granite", "Quartz", "Marble", "Cabinetry"], required: true },
  { name: "location", label: "Location" },
  { name: "year", label: "Year", type: "number" },
  { name: "description", label: "Description", type: "textarea" },
  { name: "grad", label: "Swatch gradient", placeholder: "from-stone-800 to-stone-600" },
  { name: "imageUrl", label: "Photo URL (optional)", placeholder: "https://…/kitchen.jpg" },
  { name: "featured", label: "Featured", type: "checkbox" },
];

export default async function AdminProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: [{ featured: "desc" }, { order: "asc" }],
  });

  return (
    <>
      <AdminPageHeader title="Gallery" subtitle={`${projects.length} projects — add, edit, or remove.`} />
      <div className="p-6 sm:p-8">
        <EntityManager
          endpoint="/api/projects"
          items={projects}
          fields={FIELDS}
          titleKey="title"
          subtitleKey="tag"
          colorKey="grad"
          noun="project"
        />
      </div>
    </>
  );
}
