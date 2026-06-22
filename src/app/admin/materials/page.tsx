import { prisma } from "@/lib/db";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EntityManager, type Field } from "@/components/admin/entity-manager";

export const dynamic = "force-dynamic";

const FIELDS: Field[] = [
  { name: "name", label: "Name", required: true },
  { name: "category", label: "Category", type: "select", options: ["Granite", "Quartz", "Marble", "Cabinetry"], required: true },
  { name: "kind", label: "Type", placeholder: "Natural Stone / Engineered / Built in-house" },
  { name: "origin", label: "Origin", placeholder: "Italy, Brazil…" },
  { name: "priceTier", label: "Price tier", type: "select", options: ["$", "$$", "$$$"] },
  { name: "features", label: "Features (comma separated)", placeholder: "Heat resistant, Non-porous" },
  { name: "blurb", label: "Description", type: "textarea" },
  { name: "swatch", label: "Swatch gradient", placeholder: "from-stone-700 to-stone-900" },
  { name: "imageUrl", label: "Photo URL (optional)", placeholder: "https://…/slab.jpg" },
  { name: "slabWidth", label: "Slab width (in)", type: "number" },
  { name: "slabHeight", label: "Slab height (in)", type: "number" },
  { name: "slabCost", label: "Slab cost ($)", type: "number" },
  { name: "featured", label: "Featured", type: "checkbox" },
];

export default async function AdminMaterialsPage() {
  const materials = await prisma.material.findMany({
    orderBy: [{ category: "asc" }, { order: "asc" }],
  });

  return (
    <>
      <AdminPageHeader title="Materials" subtitle={`${materials.length} materials — add, edit, or remove.`} />
      <div className="p-6 sm:p-8">
        <EntityManager
          endpoint="/api/materials"
          items={materials}
          fields={FIELDS}
          titleKey="name"
          subtitleKey="category"
          colorKey="swatch"
          noun="material"
        />
      </div>
    </>
  );
}
