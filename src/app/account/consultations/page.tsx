import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminPageHeader } from "@/components/admin/page-header";
import { CancelConsultation } from "@/components/account/cancel-consultation";
import { RescheduleConsultation } from "@/components/account/reschedule-consultation";

export const dynamic = "force-dynamic";

export default async function AccountConsultationsPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? "";
  const consultations = await prisma.consultation.findMany({
    where: { email },
    orderBy: { date: "asc" },
  });

  return (
    <>
      <AdminPageHeader
        title="My Consultations"
        subtitle={`${consultations.length} consultation(s) booked.`}
      />
      <div className="p-6 sm:p-8">
        {consultations.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-card p-10 text-center">
            <p className="text-muted-foreground">No consultations booked yet.</p>
            <Link href="/contact" className="btn-gold mt-4 inline-block px-6 py-2.5 text-sm">
              Book a consultation
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {consultations.map((c) => {
              const upcoming =
                new Date(c.date) >= new Date() && c.status !== "cancelled";
              return (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card p-5"
                >
                  <div>
                    <div className="font-medium text-white">
                      {new Date(c.date).toLocaleDateString(undefined, {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}{" "}
                      at {c.time}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {c.projectType ?? "Design consultation"}
                      {c.material ? ` · ${c.material}` : ""}
                      {c.address ? ` · ${c.address}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-sm bg-gold/15 px-3 py-1 text-xs text-gold">
                      {c.status}
                    </span>
                    {upcoming && (
                      <RescheduleConsultation
                        id={c.id}
                        date={new Date(c.date).toISOString().slice(0, 10)}
                        time={c.time}
                      />
                    )}
                    {upcoming && <CancelConsultation id={c.id} />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
