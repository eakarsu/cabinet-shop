import type { Metadata } from "next";
import { Reveal } from "@/components/site/reveal";
import { QuoteForm } from "@/components/site/quote-form";
import { COMPANY } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact & Free Estimate — Heritage Cabinet & Stone",
  description:
    "Request a free in-home estimate for cabinets and stone countertops.",
};

export default function ContactPage() {
  return (
    <>
      <section className="hero-stone pb-16 pt-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <p className="eyebrow mb-4">Get in touch</p>
            <h1 className="font-display text-5xl font-black text-white sm:text-6xl">
              Free <span className="gold-grad">estimate</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
              Tell us about your project and we&apos;ll reach out within one
              business day to schedule a no-obligation in-home measure.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-5">
          <Reveal className="lg:col-span-3">
            <QuoteForm />
          </Reveal>

          <div className="space-y-6 lg:col-span-2">
            <Reveal className="rounded-lg border border-border bg-card p-7">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gold">
                Visit the showroom
              </h3>
              <p className="text-stone-200">{COMPANY.address}</p>
              <div className="mt-5 flex h-40 items-center justify-center rounded-md border border-border bg-gradient-to-br from-stone-700 to-stone-900 text-sm text-muted-foreground">
                Map / Directions
              </div>
            </Reveal>

            <Reveal
              delay={100}
              className="space-y-4 rounded-lg border border-border bg-card p-7"
            >
              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gold">
                  Call
                </h3>
                <a
                  href={COMPANY.phoneHref}
                  className="text-lg text-white hover:text-gold"
                >
                  {COMPANY.phone}
                </a>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gold">
                  Email
                </h3>
                <a
                  href={`mailto:${COMPANY.email}`}
                  className="text-white hover:text-gold"
                >
                  {COMPANY.email}
                </a>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gold">
                  Hours
                </h3>
                <ul className="space-y-1 text-sm text-stone-200">
                  {COMPANY.hours.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
