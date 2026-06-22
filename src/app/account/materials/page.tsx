import Link from "next/link";
import { prisma } from "@/lib/db";
import { AdminPageHeader } from "@/components/admin/page-header";
import { MaterialGallery } from "@/components/site/material-gallery";

export const dynamic = "force-dynamic";

export default async function AccountMaterialsPage() {
  const materials = await prisma.material.findMany({
    orderBy: [{ category: "asc" }, { order: "asc" }],
  });

  return (
    <>
      <AdminPageHeader
        title="Browse Materials"
        subtitle={`${materials.length} surfaces & finishes — ask the concierge for a recommendation.`}
      />
      <div className="p-6 sm:p-8">
        <MaterialGallery
          materials={materials.map((m) => ({
            id: m.id,
            slug: m.slug,
            name: m.name,
            category: m.category,
            kind: m.kind,
            origin: m.origin,
            priceTier: m.priceTier,
            features: m.features,
            blurb: m.blurb,
            swatch: m.swatch,
            imageUrl: m.imageUrl,
          }))}
        />
        <div className="mt-8">
          <Link href="/contact" className="btn-gold inline-block px-6 py-3">
            Request samples
          </Link>
        </div>
      </div>
    </>
  );
}
