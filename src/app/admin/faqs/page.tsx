import { prisma } from "@/lib/db";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EntityManager, type Field } from "@/components/admin/entity-manager";

export const dynamic = "force-dynamic";

const FIELDS: Field[] = [
  { name: "question", label: "Question", required: true },
  { name: "answer", label: "Answer", type: "textarea", required: true },
];

export default async function AdminFaqsPage() {
  const faqs = await prisma.faq.findMany({ orderBy: { order: "asc" } });

  return (
    <>
      <AdminPageHeader title="FAQs" subtitle={`${faqs.length} questions — add, edit, or remove.`} />
      <div className="p-6 sm:p-8">
        <EntityManager
          endpoint="/api/faqs"
          items={faqs}
          fields={FIELDS}
          titleKey="question"
          subtitleKey="answer"
          noun="FAQ"
        />
      </div>
    </>
  );
}
