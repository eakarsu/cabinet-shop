import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export type Caller = {
  role: "admin" | "customer" | "internal" | null;
  email: string | null;
};

/**
 * Resolve who is calling an API route.
 * - "internal": server-to-server calls (e.g. the AI assistant) that pass the
 *   shared secret header. Treated as fully trusted.
 * - "admin" / "customer": from the NextAuth session.
 */
export async function getCaller(req: Request): Promise<Caller> {
  const token = req.headers.get("x-internal-token");
  if (token && process.env.NEXTAUTH_SECRET && token === process.env.NEXTAUTH_SECRET) {
    return { role: "internal", email: null };
  }
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role === "admin") return { role: "admin", email: session?.user?.email ?? null };
  if (session?.user) return { role: "customer", email: session.user.email ?? null };
  return { role: null, email: null };
}

export function isPrivileged(c: Caller) {
  return c.role === "admin" || c.role === "internal";
}
