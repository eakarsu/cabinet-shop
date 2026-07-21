import { prisma } from "@/lib/db";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AccountsManager } from "@/components/admin/accounts-manager";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const [accounts, staff] = await Promise.all([
    prisma.account.findMany({ include: { _count: { select: { contacts: true } } }, orderBy: { updatedAt: "desc" } }),
    prisma.user.findMany({ where: { role: "admin", active: true }, select: { id: true, name: true, email: true }, orderBy: { name: "asc" } }),
  ]);
  return <><AdminPageHeader title="Accounts" subtitle="Owned prospect and customer accounts with explicit lifecycle states." /><div className="p-6 sm:p-8"><AccountsManager accounts={accounts} staff={staff} /></div></>;
}

