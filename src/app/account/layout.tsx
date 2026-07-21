import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { AccountSidebar } from "@/components/account/sidebar";
import { UserMenu } from "@/components/admin/user-menu";
import { AssistantWidget } from "@/components/site/assistant-widget";

export const metadata: Metadata = {
  title: "My Account — Heritage Cabinet & Stone",
};

export default async function AccountLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/account");
  if (session.user?.role === "admin") redirect("/admin");

  return (
    <div className="flex min-h-screen bg-background">
      <AccountSidebar />
      <div className="flex-1 overflow-x-hidden">
        <div className="flex items-center justify-between border-b border-border px-6 py-3 sm:px-8">
          <span className="text-sm text-muted-foreground md:hidden">My Account</span>
          <div className="ml-auto">
            <UserMenu name={session.user?.name} email={session.user?.email} />
          </div>
        </div>
        {children}
      </div>
      <AssistantWidget />
    </div>
  );
}
