/**
 * Fire-and-forget email notifications via the Resend HTTP API (no SDK needed).
 * No-ops silently unless RESEND_API_KEY and LEAD_NOTIFY_EMAIL are set, so the
 * site works fine without email configured.
 */
export async function notifyTeam(subject: string, lines: string[]) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_NOTIFY_EMAIL;
  if (!key || !to) return;
  const from = process.env.RESEND_FROM || "Heritage Cabinet & Stone <onboarding@resend.dev>";
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        text: lines.join("\n"),
      }),
    });
  } catch {
    // Never let a notification failure break the request.
  }
}
