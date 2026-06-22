import { prisma } from "@/lib/db";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EntityManager, type Field } from "@/components/admin/entity-manager";

export const dynamic = "force-dynamic";

const FIELDS: Field[] = [
  { name: "name", label: "Customer name", required: true },
  { name: "quote", label: "Review", type: "textarea", required: true },
  { name: "detail", label: "Detail", placeholder: "Kitchen remodel, Riverton" },
  { name: "rating", label: "Rating (1-5)", type: "number" },
];

export default async function AdminTestimonialsPage() {
  const testimonials = await prisma.testimonial.findMany({ orderBy: { order: "asc" } });

  return (
    <>
      <AdminPageHeader title="Reviews" subtitle={`${testimonials.length} reviews — add, edit, or remove.`} />
      <div className="p-6 sm:p-8">
        <EntityManager
          endpoint="/api/testimonials"
          items={testimonials}
          fields={FIELDS}
          titleKey="name"
          subtitleKey="detail"
          noun="review"
        />
      </div>
    </>
  );
}
