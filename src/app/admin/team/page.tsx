import { prisma } from "@/lib/db";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EntityManager, type Field } from "@/components/admin/entity-manager";

export const dynamic = "force-dynamic";

const FIELDS: Field[] = [
  { name: "name", label: "Name", required: true },
  { name: "role", label: "Role", required: true },
  { name: "bio", label: "Bio", type: "textarea" },
  { name: "initials", label: "Initials", placeholder: "Auto from name if blank" },
];

export default async function AdminTeamPage() {
  const team = await prisma.teamMember.findMany({ orderBy: { order: "asc" } });

  return (
    <>
      <AdminPageHeader title="Team" subtitle={`${team.length} team members — add, edit, or remove.`} />
      <div className="p-6 sm:p-8">
        <EntityManager
          endpoint="/api/team"
          items={team}
          fields={FIELDS}
          titleKey="name"
          subtitleKey="role"
          noun="team member"
        />
      </div>
    </>
  );
}
