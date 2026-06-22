"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn, getSession } from "next-auth/react";
import { Loader2, ShieldCheck, User } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO = {
  admin: { email: "admin@heritage.com", password: "admin123" },
  customer: { email: "avery@example.com", password: "customer123" },
};

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [role, setRole] = useState<"admin" | "customer">("admin");
  const [email, setEmail] = useState(DEMO.admin.email);
  const [password, setPassword] = useState(DEMO.admin.password);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function pick(next: "admin" | "customer") {
    setRole(next);
    setEmail(DEMO[next].email);
    setPassword(DEMO[next].password);
    setError("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }
    const session = await getSession();
    const dest =
      params.get("callbackUrl") ||
      ((session?.user as any)?.role === "admin" ? "/admin" : "/account");
    router.push(dest);
    router.refresh();
  }

  return (
    <div className="hero-stone flex min-h-screen items-center justify-center px-5 py-16">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-gold font-display text-lg font-black text-primary-foreground">
            H
          </span>
          <span className="leading-tight">
            <span className="block font-bold tracking-wide text-white">HERITAGE</span>
            <span className="block text-[10px] tracking-[0.3em] text-gold">
              CABINET &amp; STONE
            </span>
          </span>
        </Link>

        <div className="rounded-lg border border-border bg-card p-8">
          <h1 className="font-display text-2xl font-bold text-white">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose an account — demo credentials are filled in for you.
          </p>

          {/* Role tabs */}
          <div className="mt-6 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => pick("admin")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-sm border px-3 py-2.5 text-sm transition-colors",
                role === "admin"
                  ? "border-gold bg-gold/15 text-gold"
                  : "border-border text-muted-foreground hover:text-white"
              )}
            >
              <ShieldCheck size={16} /> Admin
            </button>
            <button
              type="button"
              onClick={() => pick("customer")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-sm border px-3 py-2.5 text-sm transition-colors",
                role === "customer"
                  ? "border-gold bg-gold/15 text-gold"
                  : "border-border text-muted-foreground hover:text-white"
              )}
            >
              <User size={16} /> Customer
            </button>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-sm border border-input bg-background px-4 py-3 text-white outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-sm border border-input bg-background px-4 py-3 text-white outline-none focus:border-gold"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="btn-gold flex w-full items-center justify-center gap-2 px-8 py-3.5"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Sign in {role === "admin" ? "to Admin" : "to My Account"}
            </button>
          </form>

          <div className="mt-6 rounded-sm border border-border bg-background p-4 text-xs text-muted-foreground">
            <p className="font-semibold text-gold">Demo credentials</p>
            <p className="mt-1">Admin — admin@heritage.com / admin123</p>
            <p>Customer — avery@example.com / customer123</p>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New customer?{" "}
            <Link href="/register" className="text-gold hover:underline">
              Create an account
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-gold">
            ← Back to site
          </Link>
        </p>
      </div>
    </div>
  );
}
