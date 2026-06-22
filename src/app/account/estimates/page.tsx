import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminPageHeader } from "@/components/admin/page-header";

export const dynamic = "force-dynamic";

export default async function AccountEstimatesPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? "";
  const quotes = await prisma.quoteRequest.findMany({
    where: { email },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <AdminPageHeader title="My Estimates" subtitle={`${quotes.length} estimate request(s).`} />
      <div className="p-6 sm:p-8">
        {quotes.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-card p-10 text-center">
            <p className="text-muted-foreground">You haven&apos;t requested an estimate yet.</p>
            <Link href="/contact" className="btn-gold mt-4 inline-block px-6 py-2.5 text-sm">
              Request a free estimate
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {quotes.map((q) => (
              <div
                key={q.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card p-5"
              >
                <div>
                  <div className="font-medium text-white">
                    {q.projectType ?? "Estimate request"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {q.material ? `${q.material} · ` : ""}
                    {q.zip ? `${q.zip} · ` : ""}
                    Requested {new Date(q.createdAt).toLocaleDateString()} · via {q.source}
                  </div>
                  {q.message && (
                    <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{q.message}</p>
                  )}
                </div>
                <span className="rounded-sm bg-gold/15 px-3 py-1 text-xs text-gold">
                  {q.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
