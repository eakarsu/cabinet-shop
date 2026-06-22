import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/site/reveal";
import { ProjectGallery } from "@/components/site/project-gallery";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gallery — Heritage Cabinet & Stone",
  description:
    "Kitchens, baths, and cabinetry completed by Heritage Cabinet & Stone.",
};

export default async function GalleryPage() {
  const projects = await prisma.project.findMany({
    orderBy: [{ featured: "desc" }, { order: "asc" }],
  });

  return (
    <>
      <section className="hero-stone pb-16 pt-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <p className="eyebrow mb-4">Our work</p>
            <h1 className="font-display text-5xl font-black text-white sm:text-6xl">
              Project <span className="gold-grad">gallery</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
              {projects.length} kitchens, baths, and cabinetry projects
              we&apos;ve fabricated and installed for local homeowners.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <ProjectGallery
            showFilter
            projects={projects.map((p) => ({
              id: p.id,
              title: p.title,
              tag: p.tag,
              location: p.location,
              year: p.year,
              description: p.description,
              grad: p.grad,
              imageUrl: p.imageUrl,
            }))}
          />
        </div>
      </section>

      <section className="border-y border-border bg-card py-20">
        <div className="mx-auto max-w-5xl px-5 text-center sm:px-8">
          <Reveal>
            <h2 className="font-display text-4xl font-bold text-white">
              Your kitchen could be next
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Book a free estimate and let&apos;s design something you&apos;ll
              love for decades.
            </p>
            <Link href="/contact" className="btn-gold mt-8 inline-block px-8 py-3.5">
              Start Your Project
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
