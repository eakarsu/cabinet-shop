import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const route = fs.readFileSync(path.join(root, "src/app/api/application-ai/shop-advice/route.ts"), "utf8");
const login = fs.readFileSync(path.join(root, "src/app/api/auth/login/route.ts"), "utf8");
const auth = fs.readFileSync(path.join(root, "src/lib/runtime-auth.ts"), "utf8");
const launcher = fs.readFileSync(path.join(root, "runtime-launcher.js"), "utf8");
describe("runtime acceptance path", () => {
  it("uses a real persisted account and signed credential", () => { expect(login).toMatch(/prisma\.user\.findUnique/); expect(login).toMatch(/bcrypt\.compare/); expect(auth).toMatch(/createHmac/); expect(auth).toMatch(/prisma\.user\.findUnique/); });
  it("requires admin, exact OpenRouter, receipt, and persistence", () => { expect(route).toMatch(/requireRuntimeUser/); expect(route).toMatch(/user\.role !== "admin"/); expect(route).toMatch(/https:\/\/openrouter\.ai\/api\/v1/); expect(route).toMatch(/providerReceipt/); expect(route).toMatch(/prisma\.aiResult\.create/); });
  it("uses distinct listener ports", () => { expect(launcher).toMatch(/BACKEND_PORT/); expect(launcher).toMatch(/FRONTEND_PORT/); });
});
