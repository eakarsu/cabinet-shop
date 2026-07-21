import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";

export async function consumeRateLimit(
  scope: string,
  subject: string,
  limit: number,
  windowMs: number,
  now = new Date()
) {
  const startMs = Math.floor(now.getTime() / windowMs) * windowMs;
  const windowStart = new Date(startMs);
  const expiresAt = new Date(startMs + windowMs * 2);
  const subjectHash = createHash("sha256").update(subject).digest("hex");
  const bucket = await prisma.rateLimitBucket.upsert({
    where: { scope_subjectHash_windowStart: { scope, subjectHash, windowStart } },
    create: { scope, subjectHash, windowStart, expiresAt, count: 1 },
    update: { count: { increment: 1 }, expiresAt },
  });
  return {
    allowed: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: new Date(startMs + windowMs),
  };
}

export function requestSubject(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip") || "unknown";
}

