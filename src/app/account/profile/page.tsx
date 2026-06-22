import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ProfileEditor } from "@/components/account/profile-editor";

export const dynamic = "force-dynamic";

export default async function AccountProfilePage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? "";
  const user = await prisma.user.findUnique({ where: { email } });

  const fields = [
    { label: "Name", value: user?.name ?? session?.user?.name ?? "—" },
    { label: "Email", value: email },
    { label: "Account type", value: user?.role ?? "customer" },
    {
      label: "Member since",
      value: user ? new Date(user.createdAt).toLocaleDateString() : "—",
    },
  ];

  return (
    <>
      <AdminPageHeader title="Profile" subtitle="Your account details." />
      <div className="p-6 sm:p-8">
        <div className="max-w-xl divide-y divide-border rounded-md border border-border bg-card">
          {fields.map((f) => (
            <div key={f.label} className="flex items-center justify-between px-5 py-4">
              <span className="text-sm text-muted-foreground">{f.label}</span>
              <span className="text-sm font-medium text-white">{f.value}</span>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <ProfileEditor initialName={user?.name ?? session?.user?.name ?? ""} />
        </div>
      </div>
    </>
  );
}
