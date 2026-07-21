import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/sidebar";
import { UserMenu } from "@/components/admin/user-menu";
import { AssistantWidget } from "@/components/site/assistant-widget";

export const metadata: Metadata = {
  title: "Admin — Heritage Cabinet & Stone",
};

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if (session.user?.role !== "admin") redirect("/account");

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 overflow-x-hidden">
        <div className="flex items-center justify-end border-b border-border px-6 py-3 sm:px-8">
          <UserMenu name={session.user?.name} email={session.user?.email} />
        </div>
        {children}
      </div>
      <AssistantWidget />
    </div>
  );
}
