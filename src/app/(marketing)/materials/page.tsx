import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/site/reveal";
import { MaterialGallery } from "@/components/site/material-gallery";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Materials — Heritage Cabinet & Stone",
  description:
    "Granite, quartz, marble, and custom cabinetry, fabricated in our own shop.",
};

const CATEGORIES = ["All", "Granite", "Quartz", "Marble", "Cabinetry"];

export default async function MaterialsPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const active = CATEGORIES.includes(searchParams.category ?? "")
    ? (searchParams.category as string)
    : "All";

  const materials = await prisma.material.findMany({
    where: active === "All" ? {} : { category: { equals: active, mode: "insensitive" } },
    orderBy: [{ category: "asc" }, { order: "asc" }],
  });

  return (
    <>
      <section className="hero-stone pb-12 pt-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <p className="eyebrow mb-4">Materials</p>
            <h1 className="font-display text-5xl font-black text-white sm:text-6xl">
              Surfaces &amp; <span className="gold-grad">cabinetry</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
              {active === "All"
                ? `${materials.length} hand-selected materials, all fabricated in our own shop.`
                : `${materials.length} ${active.toLowerCase()} option${materials.length === 1 ? "" : "s"} in stock.`}{" "}
              Visit the showroom to see full slabs and door samples in person.
            </p>
          </Reveal>

          {/* Filter chips (deep-linked from the nav dropdown) */}
          <Reveal className="mt-8 flex flex-wrap gap-3">
            {CATEGORIES.map((c) => (
              <Link
                key={c}
                href={c === "All" ? "/materials" : `/materials?category=${c}`}
                className={cn(
                  "rounded-sm border px-5 py-2 text-sm transition-colors",
                  active === c
                    ? "border-gold bg-gold text-primary-foreground"
                    : "border-border text-stone-200 hover:border-gold/50"
                )}
              >
                {c}
              </Link>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
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
        </div>
      </section>

      <section className="border-y border-border bg-card py-20">
        <div className="mx-auto max-w-5xl px-5 text-center sm:px-8">
          <Reveal>
            <h2 className="font-display text-4xl font-bold text-white">
              Not sure which material is right?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Tell us about your space and budget — or ask our concierge — and
              we&apos;ll recommend the best fit and pull samples for you.
            </p>
            <Link href="/contact" className="btn-gold mt-8 inline-block px-8 py-3.5">
              Talk to a Designer
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
