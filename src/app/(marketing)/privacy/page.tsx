import type { Metadata } from "next";
import { PrivacyControls } from "@/components/site/privacy-controls";

export const metadata: Metadata = { title: "Privacy & Preferences — Heritage Cabinet & Stone" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 pb-20 pt-32 sm:px-8">
      <p className="eyebrow">Privacy controls</p>
      <h1 className="mt-3 font-display text-4xl font-black text-white">Your information, your choice</h1>
      <p className="mb-10 mt-4 max-w-3xl text-muted-foreground">
        Project inquiries are used to respond to the service you requested. Automated customer outreach is never sent directly from AI: messages require independent staff review, current consent, and a final suppression check. Connector credentials remain in deployment secrets, and AI audit records retain digests and sizes rather than message contents.
      </p>
      <PrivacyControls />
    </main>
  );
}

