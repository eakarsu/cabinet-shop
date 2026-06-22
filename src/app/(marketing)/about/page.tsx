import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/site/reveal";
import { prisma } from "@/lib/db";
import { COMPANY } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About — Heritage Cabinet & Stone",
  description:
    "A family-owned cabinet and stone fabricator serving the region since 1998.",
};

const VALUES = [
  {
    title: "Do it in-house",
    text: "Design, fabrication, and installation under one roof means one point of accountability — ours.",
  },
  {
    title: "Honest quotes",
    text: "A detailed written estimate with no hidden fees. The price we quote is the price you pay.",
  },
  {
    title: "Stand behind it",
    text: "Workmanship warranty on every install, and we pick up the phone when you call.",
  },
];

export default async function AboutPage() {
  const [team, faqs, projectCount] = await Promise.all([
    prisma.teamMember.findMany({ orderBy: { order: "asc" } }),
    prisma.faq.findMany({ orderBy: { order: "asc" } }),
    prisma.project.count(),
  ]);

  const aboutStats = [
    { value: String(COMPANY.established), label: "Founded" },
    { value: "6,000+", label: "Projects delivered" },
    { value: String(team.length), label: "Team members" },
    { value: "4.9★", label: "Average review" },
  ];

  return (
    <>
      <section className="hero-stone pb-16 pt-32">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2">
          <Reveal>
            <p className="eyebrow mb-4">Our story</p>
            <h1 className="font-display text-5xl font-black text-white sm:text-6xl">
              A family <span className="gold-grad">craft</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Heritage Cabinet &amp; Stone started in {COMPANY.established} in a
              two-bay shop with a single saw and a simple idea: do the whole job
              ourselves, and do it right. Twenty-five years on, we still
              fabricate every counter and build every cabinet under our own roof.
            </p>
            <p className="mt-4 text-muted-foreground">
              We&apos;re not a showroom that subs out the hard part. Our
              designers, fabricators, and install crews all work for us — so the
              person who measures your kitchen is accountable for the result.
            </p>
          </Reveal>
          <Reveal delay={150} className="grid grid-cols-2 gap-4">
            <div className="swatch lift h-44 rounded-md border border-stone-700 bg-gradient-to-br from-stone-700 to-stone-900" />
            <div className="swatch lift mt-8 h-44 rounded-md border border-amber-900 bg-gradient-to-br from-amber-700 to-amber-950" />
            <div className="swatch lift -mt-2 h-44 rounded-md border border-slate-200 bg-gradient-to-br from-slate-100 to-slate-300" />
            <div className="swatch lift mt-4 h-44 rounded-md border border-zinc-300 bg-gradient-to-br from-zinc-200 to-zinc-400" />
          </Reveal>
        </div>
      </section>

      {/* VALUES */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="max-w-2xl">
            <p className="eyebrow mb-4">What we stand for</p>
            <h2 className="font-display text-4xl font-bold text-white sm:text-5xl">
              Built on a few stubborn beliefs
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {VALUES.map((v, i) => (
              <Reveal
                key={v.title}
                delay={i * 80}
                className="lift rounded-md border border-border bg-card p-7"
              >
                <h3 className="text-xl font-bold text-white">{v.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{v.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-5 py-12 text-center sm:px-8 md:grid-cols-4">
          {aboutStats.map((s, i) => (
            <Reveal key={s.label} delay={i * 80}>
              <div className="font-display text-4xl font-black gold-grad">{s.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* TEAM */}
      <section id="team" className="scroll-mt-24 py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="max-w-2xl">
            <p className="eyebrow mb-4">Meet the team</p>
            <h2 className="font-display text-4xl font-bold text-white sm:text-5xl">
              The people behind the build
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {team.map((member, i) => (
              <Reveal
                key={member.id}
                delay={(i % 5) * 60}
                className="lift rounded-md border border-border bg-card p-6 text-center"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/15 font-display text-xl font-bold text-gold">
                  {member.initials}
                </div>
                <h3 className="mt-4 font-bold text-white">{member.name}</h3>
                <p className="text-sm text-gold">{member.role}</p>
                {member.bio && (
                  <p className="mt-2 text-xs text-muted-foreground">{member.bio}</p>
                )}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-24 border-y border-border bg-[hsl(240_7%_5%)] py-24">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <Reveal className="text-center">
            <p className="eyebrow mb-4">Questions</p>
            <h2 className="font-display text-4xl font-bold text-white sm:text-5xl">
              Frequently asked
            </h2>
          </Reveal>
          <div className="mt-12 space-y-3">
            {faqs.map((f, i) => (
              <Reveal key={f.id} delay={(i % 4) * 60}>
                <details className="group rounded-md border border-border bg-card p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-white">
                    {f.question}
                    <span className="text-gold transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground">{f.answer}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-5xl px-5 text-center sm:px-8">
          <Reveal>
            <h2 className="font-display text-4xl font-bold text-white">
              Come see the shop
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Visit our showroom to walk the slab yard and meet the {team.length}{" "}
              people who&apos;ll build your kitchen. We&apos;ve delivered{" "}
              {projectCount}+ projects and counting.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/contact" className="btn-gold px-8 py-3.5">
                Book a Visit
              </Link>
              <Link href="/gallery" className="btn-outline-gold px-8 py-3.5">
                See Our Work
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
