"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not create account.");
      // Auto sign-in
      const s = await signIn("credentials", { email, password, redirect: false });
      if (s?.error) throw new Error("Account created — please sign in.");
      router.push("/account");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
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
            <span className="block text-[10px] tracking-[0.3em] text-gold">CABINET &amp; STONE</span>
          </span>
        </Link>

        <div className="rounded-lg border border-border bg-card p-8">
          <h1 className="font-display text-2xl font-bold text-white">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your estimates and consultations in one place.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-sm border border-input bg-background px-4 py-3 text-white outline-none focus:border-gold"
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-sm border border-input bg-background px-4 py-3 text-white outline-none focus:border-gold"
                placeholder="you@email.com"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-sm border border-input bg-background px-4 py-3 text-white outline-none focus:border-gold"
                minLength={12}
                maxLength={72}
                autoComplete="new-password"
                placeholder="12-72 characters"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="btn-gold flex w-full items-center justify-center gap-2 px-8 py-3.5"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Create account
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-gold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
