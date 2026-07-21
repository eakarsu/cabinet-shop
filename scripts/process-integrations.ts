import { drainIntegrationEvents } from "../src/lib/integration-worker";
import { prisma } from "../src/lib/db";

const requested = Number(process.argv[2] || "100");
const limit = Number.isInteger(requested) ? Math.min(1000, Math.max(1, requested)) : 100;

drainIntegrationEvents(limit)
  .then((count) => console.log(`Processed ${count} integration event(s).`))
  .finally(() => prisma.$disconnect());

