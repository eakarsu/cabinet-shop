import { test, expect } from "@playwright/test";
import { prisma } from "../../src/lib/db";

test.beforeAll(async () => {
  const database = new URL(process.env.DATABASE_URL || "").pathname;
  if (!database.includes("test")) throw new Error("E2E tests require a test database.");
});

test.afterAll(async () => {
  await prisma.suppressionEntry.deleteMany({ where: { source: "privacy_form" } });
  await prisma.attributionTouch.deleteMany({ where: { quote: { normalizedEmail: "browser@example.com" } } });
  await prisma.auditEvent.deleteMany({ where: { entityType: "QuoteRequest", entityId: { not: null } } });
  await prisma.quoteRequest.deleteMany({ where: { normalizedEmail: "browser@example.com" } });
  await prisma.consentRecord.deleteMany({ where: { contact: { normalizedEmail: "browser@example.com" } } });
  await prisma.contact.deleteMany({ where: { normalizedEmail: "browser@example.com" } });
  await prisma.rateLimitBucket.deleteMany();
  await prisma.$disconnect();
});

test("guest submits one governed quote and cannot list private leads", async ({ page, request }) => {
  await page.goto("/contact");
  await page.locator('input[name="name"]').fill("Browser Customer");
  await page.locator('input[name="phone"]').fill("555 444 3333");
  await page.locator('input[name="email"]').fill("browser@example.com");
  await page.locator('textarea[name="message"]').fill("A quartz kitchen estimate");
  await page.getByRole("button", { name: /request my free estimate/i }).click();
  await expect(page.getByRole("heading", { name: "Request received" })).toBeVisible();
  expect(await prisma.quoteRequest.count({ where: { normalizedEmail: "browser@example.com" } })).toBe(1);
  const privateResponse = await request.get("/api/quotes");
  expect(privateResponse.status()).toBe(401);
});

test("guest records an opt-out without exposing stored identity", async ({ page }) => {
  await page.goto("/privacy");
  const form = page.locator("form").first();
  await form.locator('input[name="value"]').fill("browser@example.com");
  await form.getByRole("button", { name: "Save opt-out" }).click();
  await expect(form.getByRole("status")).toContainText("recorded");
  const rows = await prisma.suppressionEntry.findMany({ where: { source: "privacy_form" } });
  expect(rows).toHaveLength(1);
  expect(JSON.stringify(rows)).not.toContain("browser@example.com");
});

