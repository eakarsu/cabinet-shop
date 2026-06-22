import { Suspense } from "react";
import { LoginForm } from "@/components/site/login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="hero-stone min-h-screen" />}>
      <LoginForm />
    </Suspense>
  );
}
