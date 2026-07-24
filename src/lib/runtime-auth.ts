import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";

type RuntimeClaims = { sub: string; email: string; role: string; exp: number; iss: string };

function secret() {
  const value = process.env.NEXTAUTH_SECRET || "";
  if (value.length < 32) throw new Error("NEXTAUTH_SECRET is not configured");
  return value;
}
function encode(value: unknown) { return Buffer.from(JSON.stringify(value)).toString("base64url"); }

export function issueRuntimeToken(user: { id: string; email: string; role: string }) {
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: user.id, email: user.email, role: user.role, iat: now, exp: now + 1800, iss: "cabinet-shop-runtime" })}`;
  return `${unsigned}.${createHmac("sha256", secret()).update(unsigned).digest("base64url")}`;
}

export async function requireRuntimeUser(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) throw new Error("Authentication required");
  const parts = authorization.slice(7).split(".");
  if (parts.length !== 3) throw new Error("Invalid credential");
  const unsigned = `${parts[0]}.${parts[1]}`;
  const expected = createHmac("sha256", secret()).update(unsigned).digest();
  const actual = Buffer.from(parts[2], "base64url");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) throw new Error("Invalid credential");
  const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as RuntimeClaims;
  if (claims.iss !== "cabinet-shop-runtime" || !claims.sub || claims.exp <= Math.floor(Date.now() / 1000)) throw new Error("Expired credential");
  const user = await prisma.user.findUnique({ where: { id: claims.sub }, select: { id: true, email: true, name: true, role: true, active: true } });
  if (!user?.active || user.email !== claims.email || user.role !== claims.role) throw new Error("Inactive credential");
  return user;
}
