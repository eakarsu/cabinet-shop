"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn, getSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function routeAfterSignIn() {
    const session = await getSession();
    const requested = params.get("callbackUrl");
    const safeCallback = requested?.startsWith("/") && !requested.startsWith("//") ? requested : null;
    const dest = safeCallback || ((session?.user as any)?.role === "admin" ? "/admin" : "/account");
    router.push(dest);
    router.refresh();
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
    await routeAfterSignIn();
  }

  async function onLocalDemo() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/local-login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Local-Login": "fill" },
        credentials: "same-origin",
      });
      const data = (await res.json().catch(() => null)) as
        | { email?: string; password?: string; error?: string }
        | null;
      if (!res.ok || !data?.email || !data?.password) {
        setError(data?.error || "Local demo credentials are unavailable.");
        setLoading(false);
        return;
      }
      setEmail(data.email);
      setPassword(data.password);
      const signInRes = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (signInRes?.error) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }
      await routeAfterSignIn();
    } catch {
      setError("Local demo credentials are unavailable.");
      setLoading(false);
    }
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
            Use the account created for you or register as a customer.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="w-full rounded-sm border border-input bg-background px-4 py-3 text-white outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full rounded-sm border border-input bg-background px-4 py-3 text-white outline-none focus:border-gold"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="button"
              onClick={onLocalDemo}
              disabled={loading}
              className="w-full rounded-sm border border-gold/60 px-4 py-3 text-sm font-semibold text-gold transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Fill local demo credentials
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-gold flex w-full items-center justify-center gap-2 px-8 py-3.5"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Sign In
            </button>
          </form>

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
