import Link from "next/link";
import { ChevronDown, Star, ArrowRight, Info, Store, ListChecks } from "lucide-react";
import { Reveal } from "@/components/site/reveal";
import { ProjectGallery } from "@/components/site/project-gallery";
import { prisma } from "@/lib/db";
import { COMPANY, STATS, STEPS, CATEGORY_TILES, SERVICE_AREAS } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [samples, premium, projects, testimonials] = await Promise.all([
    prisma.material.findMany({ where: { featured: true }, orderBy: { order: "asc" }, take: 4 }),
    prisma.material.findFirst({ where: { category: "Marble", featured: true }, orderBy: { order: "asc" } }),
    prisma.project.findMany({ where: { featured: true }, orderBy: { order: "asc" }, take: 6 }),
    prisma.testimonial.findMany({ orderBy: { order: "asc" }, take: 6 }),
  ]);

  return (
    <>
      {/* ===== HERO ===== */}
      <section className="hero-stone relative flex min-h-screen items-center">
        <div className="mx-auto max-w-5xl px-5 py-28 text-center sm:px-8">
          <Reveal>
            <p className="eyebrow mb-6">Est. {COMPANY.established} · Family Owned</p>
            <h1 className="font-display text-5xl font-black leading-[1.05] text-white sm:text-6xl xl:text-7xl">
              Unlocking the potential
              <br />
              in <span className="gold-grad">every space.</span>
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-lg text-muted-foreground">
              Custom cabinetry and the region&apos;s largest in-stock selection of
              natural stone and quartz — designed, fabricated, and installed by one
              local team.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-4">
              <Link href="/contact" className="btn-gold px-8 py-4">
                Schedule a Consultation
              </Link>
              <Link href="/gallery" className="btn-outline-gold px-8 py-4">
                Explore Our Work
              </Link>
            </div>
          </Reveal>
        </div>
        <a
          href="#showcase"
          aria-label="Scroll down"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gold/70 transition hover:text-gold"
        >
          <ChevronDown size={28} className="animate-bounce" />
        </a>
      </section>

      {/* ===== PRODUCT SHOWCASE (named samples) ===== */}
      <section id="showcase" className="border-y border-border bg-card py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="mb-10 text-center">
            <p className="eyebrow mb-3">In the showroom</p>
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
              Slabs our clients love
            </h2>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {samples.map((m, i) => (
              <Reveal key={m.id} delay={i * 70}>
                <Link href="/materials" className="group block">
                  <div className={`swatch lift h-56 rounded-md bg-gradient-to-br ${m.swatch}`} />
                  <div className="mt-3">
                    <div className="font-semibold text-white group-hover:text-gold">{m.name}</div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">
                      {m.category}
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PREMIUM COLLECTION FEATURE ===== */}
      {premium && (
        <section className="py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-2">
            <Reveal>
              <div className={`swatch lift h-80 rounded-lg bg-gradient-to-br ${premium.swatch}`} />
            </Reveal>
            <Reveal delay={120}>
              <p className="eyebrow mb-3">The Signature Collection</p>
              <h2 className="font-display text-4xl font-bold text-white sm:text-5xl">
                {premium.name}
              </h2>
              <p className="mt-4 text-muted-foreground">{premium.blurb}</p>
              <ul className="mt-6 flex flex-wrap gap-3 text-sm">
                {premium.features.map((f) => (
                  <li key={f} className="rounded-sm bg-gold/15 px-3 py-1.5 text-gold">{f}</li>
                ))}
              </ul>
              <Link href="/materials" className="mt-8 inline-flex items-center gap-2 text-gold hover:underline">
                View the collection <ArrowRight size={16} />
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {/* ===== QUICK NAV CARDS ===== */}
      <section className="border-y border-border bg-[hsl(240_7%_5%)] py-20">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 sm:px-8 md:grid-cols-3">
          {[
            { href: "/about", label: "About Us", text: "25 years, one in-house team.", icon: Info, grad: "from-stone-700 to-stone-900" },
            { href: "/gallery", label: "Our Showroom", text: "Walk the slab yard in person.", icon: Store, grad: "from-amber-800 to-amber-950" },
            { href: "/contact", label: "Our Process", text: "From first sketch to install day.", icon: ListChecks, grad: "from-slate-700 to-slate-900" },
          ].map((c, i) => {
            const Icon = c.icon;
            return (
              <Reveal key={c.label} delay={i * 80}>
                <Link href={c.href} className="lift group block overflow-hidden rounded-lg border border-border">
                  <div className={`relative h-44 bg-gradient-to-br ${c.grad}`}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon size={40} className="text-white/80" />
                    </div>
                  </div>
                  <div className="bg-card p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-xl font-bold text-white">{c.label}</h3>
                      <ArrowRight size={18} className="text-gold transition group-hover:translate-x-1" />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{c.text}</p>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ===== CATEGORY TILES ===== */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="mb-12 text-center">
            <p className="eyebrow mb-3">What we work in</p>
            <h2 className="font-display text-4xl font-bold text-white sm:text-5xl">
              Materials &amp; services
            </h2>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORY_TILES.map((c, i) => (
              <Reveal key={c.name} delay={(i % 3) * 80}>
                <Link
                  href={c.href}
                  className={`swatch lift group flex h-48 flex-col justify-end rounded-lg bg-gradient-to-br ${c.grad} p-6`}
                >
                  <h3 className="font-display text-2xl font-bold text-white drop-shadow">{c.name}</h3>
                  <p className="text-sm text-white/80">{c.tagline}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-5 py-12 text-center sm:px-8 md:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 70}>
              <div className="font-display text-4xl font-black gold-grad">{s.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== INSPIRATION GALLERY ===== */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-3">Inspiration</p>
              <h2 className="font-display text-4xl font-bold text-white sm:text-5xl">
                Recently installed
              </h2>
            </div>
            <Link href="/gallery" className="btn-outline-gold px-6 py-3">View full gallery</Link>
          </Reveal>
          <ProjectGallery
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

      {/* ===== PROCESS ===== */}
      <section className="border-y border-border bg-[hsl(240_7%_5%)] py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="mb-12 text-center">
            <p className="eyebrow mb-3">How it works</p>
            <h2 className="font-display text-4xl font-bold text-white sm:text-5xl">Four simple steps</h2>
          </Reveal>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <Reveal key={step.n} delay={i * 80}>
                <div className="font-display text-6xl font-black text-secondary">{step.n}</div>
                <h3 className="mt-2 text-xl font-bold text-white">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== REVIEWS ===== */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="mb-12 text-center">
            <p className="eyebrow mb-3">Reviews</p>
            <h2 className="font-display text-4xl font-bold text-white sm:text-5xl">
              What homeowners say
            </h2>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal key={t.id} delay={(i % 3) * 70} className="rounded-md border border-border bg-card p-7">
                <div className="flex text-gold">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={16} fill="currentColor" />
                  ))}
                </div>
                <blockquote className="mt-4 text-muted-foreground">&ldquo;{t.quote}&rdquo;</blockquote>
                <figcaption className="mt-5 text-sm">
                  <span className="font-semibold text-white">{t.name}</span>
                  {t.detail && <span className="block text-muted-foreground">{t.detail}</span>}
                </figcaption>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="hero-stone border-y border-border py-24">
        <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
          <Reveal>
            <h2 className="font-display text-4xl font-bold text-white sm:text-5xl">
              Ready to transform your space?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Book a free in-home measure and estimate. We&apos;ll bring samples and
              answer every question.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/contact" className="btn-gold px-8 py-4">Get Started</Link>
              <a href={COMPANY.phoneHref} className="btn-outline-gold px-8 py-4">
                Call {COMPANY.phone}
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== SERVICE AREAS ===== */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-5 text-center sm:px-8">
          <Reveal>
            <p className="eyebrow mb-4">Proudly serving</p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {SERVICE_AREAS.map((area) => (
                <span key={area} className="whitespace-nowrap">{area}</span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
