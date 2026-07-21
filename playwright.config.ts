import { defineConfig } from "@playwright/test";

const port = 3217;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  retries: 0,
  reporter: "line",
  use: { baseURL, trace: "retain-on-failure" },
  webServer: {
    command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      NEXTAUTH_URL: baseURL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "e2e-auth-0123456789abcdef0123456789abcdef",
      INTERNAL_API_TOKEN: process.env.INTERNAL_API_TOKEN || "e2e-api-abcdef0123456789abcdef0123456789",
      PRIVACY_HASH_SECRET: process.env.PRIVACY_HASH_SECRET || "e2e-hash-fedcba9876543210fedcba9876543210",
    },
  },
});

