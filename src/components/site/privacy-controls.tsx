"use client";

import { useState } from "react";

const field = "w-full rounded-sm border border-input bg-background px-3 py-2 text-white outline-none focus:border-gold";

export function PrivacyControls() {
  const [preferenceMessage, setPreferenceMessage] = useState("");
  const [requestMessage, setRequestMessage] = useState("");

  async function submitPreference(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/privacy/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, action: "opt_out" }),
    });
    setPreferenceMessage(response.ok ? "Your opt-out has been recorded." : (await response.json())?.error || "Unable to save preference.");
  }

  async function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/privacy/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    setRequestMessage(response.ok ? `Request received. Reference: ${result.id}` : result?.error || "Unable to submit request.");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={submitPreference} className="space-y-4 rounded-lg border border-border bg-card p-6">
        <h2 className="font-display text-2xl font-bold text-white">Opt out</h2>
        <p className="text-sm text-muted-foreground">Suppression takes priority over every consent record and is checked again immediately before outreach.</p>
        <select name="channel" className={field} aria-label="Channel">
          <option value="email">Email</option>
          <option value="sms">SMS</option>
          <option value="phone">Phone</option>
        </select>
        <input name="value" required className={field} placeholder="Email address or phone number" aria-label="Email address or phone number" />
        <select name="region" className={field} aria-label="Region">
          <option value="US">United States</option><option value="US-CA">California</option><option value="CA">Canada</option><option value="EU">European Union</option><option value="UK">United Kingdom</option>
        </select>
        <button className="btn-gold px-5 py-2.5">Save opt-out</button>
        {preferenceMessage && <p role="status" className="text-sm text-gold">{preferenceMessage}</p>}
      </form>

      <form onSubmit={submitRequest} className="space-y-4 rounded-lg border border-border bg-card p-6">
        <h2 className="font-display text-2xl font-bold text-white">Data request</h2>
        <p className="text-sm text-muted-foreground">Request access, correction, or deletion. We record a regional due date and verify identity before disclosure or deletion.</p>
        <input name="email" type="email" required className={field} placeholder="you@example.com" aria-label="Email address" />
        <select name="requestType" className={field} aria-label="Request type">
          <option value="access">Access my data</option><option value="correct">Correct my data</option><option value="delete">Delete my data</option>
        </select>
        <select name="region" className={field} aria-label="Region">
          <option value="US">United States</option><option value="US-CA">California</option><option value="CA">Canada</option><option value="EU">European Union</option><option value="UK">United Kingdom</option>
        </select>
        <button className="btn-gold px-5 py-2.5">Submit request</button>
        {requestMessage && <p role="status" className="text-sm text-gold">{requestMessage}</p>}
      </form>
    </div>
  );
}

