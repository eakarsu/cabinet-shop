import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { consumeRateLimit } from "@/lib/rate-limit";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email.trim().toLowerCase();
        const budget = await consumeRateLimit("login", email, 10, 15 * 60 * 1000);
        if (!budget.allowed) return null;
        const user = await prisma.user.findUnique({
          where: { email },
        });
        if (!user || !user.active || (user.lockedUntil && user.lockedUntil > new Date())) return null;
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) {
          const failures = user.failedLoginCount + 1;
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginCount: failures,
              lockedUntil: failures >= 10 ? new Date(Date.now() + 15 * 60 * 1000) : null,
            },
          });
          return null;
        }
        await prisma.user.update({
          where: { id: user.id },
          data: { failedLoginCount: 0, lockedUntil: null },
        });
        return {
          id: user.id,
          email: user.email,
          name: user.name || "User",
          role: user.role,
        };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
        token.active = true;
      } else if (token.id) {
        const current = await prisma.user.findUnique({
          where: { id: String(token.id) },
          select: { active: true, role: true },
        });
        token.active = !!current?.active;
        if (current) token.role = current.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.active !== false) {
        (session.user as any).role = token.role as string;
        (session.user as any).id = token.id as string;
      } else {
        (session as any).user = undefined;
      }
      return session;
    },
  },
  pages: { signIn: "/login", error: "/login" },
  useSecureCookies: process.env.NODE_ENV === "production",
};
