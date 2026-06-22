"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

const PROJECT_TYPES = [
  "Kitchen countertops",
  "Bathroom vanity",
  "Custom cabinetry",
  "Cabinet refacing",
  "Full kitchen remodel",
  "Other",
];

const MATERIAL_OPTIONS = [
  "Not sure yet",
  "Granite",
  "Quartz",
  "Marble",
  "Wood cabinetry",
];

const inputClass =
  "w-full rounded-sm border border-input bg-background px-4 py-3 text-white outline-none transition-colors focus:border-gold";

export function QuoteForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Request failed");
      form.reset();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-lg border border-gold/40 bg-gold/10 p-8 text-center">
        <CheckCircle2 className="mx-auto text-gold" size={40} />
        <h3 className="mt-4 font-display text-2xl font-bold text-white">
          Request received
        </h3>
        <p className="mt-2 text-muted-foreground">
          Thanks — we&apos;ll be in touch within one business day to schedule
          your free in-home measure.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="btn-outline-gold mt-6 px-6 py-2.5"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-lg border border-border bg-card p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm text-muted-foreground">
            Full name
          </label>
          <input name="name" required className={inputClass} placeholder="Jane Doe" />
        </div>
        <div>
          <label className="mb-2 block text-sm text-muted-foreground">
            Phone
          </label>
          <input
            name="phone"
            type="tel"
            required
            className={inputClass}
            placeholder="(555) 000-0000"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm text-muted-foreground">
            Email
          </label>
          <input
            name="email"
            type="email"
            required
            className={inputClass}
            placeholder="you@email.com"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm text-muted-foreground">
            Project type
          </label>
          <select name="projectType" className={inputClass}>
            {PROJECT_TYPES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm text-muted-foreground">
            Material interest
          </label>
          <select name="material" className={inputClass}>
            {MATERIAL_OPTIONS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm text-muted-foreground">
            Zip code
          </label>
          <input name="zip" className={inputClass} placeholder="00000" />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm text-muted-foreground">
          Tell us about your project
        </label>
        <textarea
          name="message"
          rows={4}
          className={inputClass}
          placeholder="Approximate size, timeline, style you're going for..."
        />
      </div>

      {status === "error" && (
        <p className="text-sm text-red-400">
          Something went wrong. Please try again or call us directly.
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="btn-gold w-full px-8 py-3.5 sm:w-auto"
      >
        {status === "sending" ? "Sending..." : "Request My Free Estimate"}
      </button>
      <p className="text-xs text-muted-foreground">
        By submitting you agree to be contacted about your project. We never
        share your information.
      </p>
    </form>
  );
}
