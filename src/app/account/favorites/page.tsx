import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminPageHeader } from "@/components/admin/page-header";

export const dynamic = "force-dynamic";

export default async function AccountFavoritesPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? "";
  const favs = await prisma.favorite.findMany({ where: { email } });
  const ids = favs.map((f) => f.materialId);
  const materials = ids.length
    ? await prisma.material.findMany({ where: { id: { in: ids } } })
    : [];

  return (
    <>
      <AdminPageHeader title="Saved Materials" subtitle={`${materials.length} favorite(s).`} />
      <div className="p-6 sm:p-8">
        {materials.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-card p-10 text-center">
            <p className="text-muted-foreground">
              You haven&apos;t saved any materials yet.
            </p>
            <Link href="/materials" className="btn-gold mt-4 inline-block px-6 py-2.5 text-sm">
              Browse materials
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {materials.map((m) => (
              <Link
                key={m.id}
                href={`/materials/${m.slug}`}
                className="lift overflow-hidden rounded-lg border border-border bg-card"
              >
                <div className="h-40 overflow-hidden">
                  {m.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.imageUrl} alt={m.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className={`h-full w-full bg-gradient-to-br ${m.swatch}`} />
                  )}
                </div>
                <div className="p-5">
                  <p className="eyebrow">{m.category}</p>
                  <h3 className="mt-1 font-display text-lg font-bold text-white">{m.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
