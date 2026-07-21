import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Layers, Tag } from "lucide-react";
import { Reveal } from "@/components/site/reveal";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { FavoriteButton } from "@/components/site/favorite-button";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const material = await prisma.material.findUnique({ where: { slug } });
  return {
    title: material
      ? `${material.name} — Heritage Cabinet & Stone`
      : "Material — Heritage Cabinet & Stone",
  };
}

export default async function MaterialDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const material = await prisma.material.findUnique({ where: { slug } });
  if (!material) notFound();

  // Other colors in the same category.
  const siblings = await prisma.material.findMany({
    where: { category: material.category, slug: { not: material.slug } },
    orderBy: { order: "asc" },
  });

  // Is this material saved by the signed-in customer?
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  const favorited = email
    ? !!(await prisma.favorite.findUnique({
        where: { email_materialId: { email, materialId: material.id } },
      }))
    : false;

  return (
    <>
      {/* Hero */}
      <section className="hero-stone pb-12 pt-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <Link
              href={`/materials?category=${material.category}`}
              className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold"
            >
              <ArrowLeft size={16} /> All {material.category}
            </Link>
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div className="lift h-80 overflow-hidden rounded-lg border border-border">
                {material.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={material.imageUrl}
                    alt={material.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className={`swatch h-full w-full bg-gradient-to-br ${material.swatch}`} />
                )}
              </div>
              <div>
                <p className="eyebrow mb-3">{material.category}</p>
                <h1 className="font-display text-5xl font-black text-white">
                  {material.name}
                </h1>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Layers size={15} className="text-gold" /> {material.kind}
                  </span>
                  {material.origin && (
                    <span className="flex items-center gap-1">
                      <MapPin size={15} className="text-gold" /> {material.origin}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Tag size={15} className="text-gold" /> {material.priceTier}
                  </span>
                </div>
                <p className="mt-5 text-lg text-muted-foreground">{material.blurb}</p>
                <ul className="mt-6 flex flex-wrap gap-3 text-sm">
                  {material.features.map((f) => (
                    <li key={f} className="rounded-sm bg-gold/15 px-3 py-1.5 text-gold">
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link href="/contact" className="btn-gold px-7 py-3.5">
                    Request a sample
                  </Link>
                  <FavoriteButton
                    materialId={material.id}
                    initial={favorited}
                    signedIn={!!email}
                  />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Other colors in this category */}
      {siblings.length > 0 && (
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <Reveal className="mb-10">
              <p className="eyebrow mb-3">More options</p>
              <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
                Other {material.category.toLowerCase()} colors
              </h2>
            </Reveal>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {siblings.map((s, i) => (
                <Reveal key={s.id} delay={(i % 4) * 70}>
                  <Link
                    href={`/materials/${s.slug}`}
                    className="lift group block overflow-hidden rounded-lg border border-border bg-card"
                  >
                    <div className={`swatch h-40 bg-gradient-to-br ${s.swatch}`} />
                    <div className="p-5">
                      <div className="flex items-center justify-between">
                        <p className="eyebrow">{s.category}</p>
                        <span className="text-sm text-gold">{s.priceTier}</span>
                      </div>
                      <h3 className="mt-2 font-display text-lg font-bold text-white group-hover:text-gold">
                        {s.name}
                      </h3>
                      {s.origin && (
                        <p className="mt-1 text-xs text-muted-foreground">{s.origin}</p>
                      )}
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-y border-border bg-card py-16">
        <div className="mx-auto max-w-5xl px-5 text-center sm:px-8">
          <Reveal>
            <h2 className="font-display text-3xl font-bold text-white">
              Like {material.name}?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Book a free consultation and we&apos;ll bring a full slab sample to
              your home.
            </p>
            <Link href="/contact" className="btn-gold mt-6 inline-block px-8 py-3.5">
              Book a Consultation
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
