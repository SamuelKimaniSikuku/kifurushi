"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signUpSchema, zodErrors, FieldErrors } from "@/lib/validation";
import { signIn } from "@/lib/store";

function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = signUpSchema.safeParse(
      mode === "signin" ? { ...form, name: form.name || "Member" } : form
    );
    if (!parsed.success) {
      setErrors(zodErrors(parsed.error));
      return;
    }
    signIn(parsed.data.name, parsed.data.email);
    router.push(next.startsWith("/") ? next : "/dashboard");
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="text-center text-3xl font-extrabold text-[var(--forest)]">
        {mode === "signup" ? "Join Kifurushi" : "Welcome back"}
      </h1>
      <p className="mt-2 text-center text-sm text-[#5c6b63]">
        One account for sending and travelling.
      </p>

      <form onSubmit={submit} className="card mt-6 space-y-4 p-6" noValidate>
        {mode === "signup" && (
          <div>
            <label className="field-label" htmlFor="name">Full name</label>
            <input id="name" className="field" autoComplete="name" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
            {errors.name && <p className="field-error">{errors.name}</p>}
          </div>
        )}
        <div>
          <label className="field-label" htmlFor="email">Email</label>
          <input id="email" type="email" className="field" autoComplete="email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
          {errors.email && <p className="field-error">{errors.email}</p>}
        </div>
        <div>
          <label className="field-label" htmlFor="password">Password</label>
          <input id="password" type="password" className="field"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
          {errors.password && <p className="field-error">{errors.password}</p>}
          {mode === "signup" && !errors.password && (
            <p className="mt-1 text-xs text-[#5c6b63]">
              At least 10 characters with upper, lower and a number.
            </p>
          )}
        </div>

        <button type="submit" className="btn-primary w-full py-3">
          {mode === "signup" ? "Create account" : "Sign in"}
        </button>

        <p className="text-center text-xs text-[#5c6b63]">
          {mode === "signup" ? "Already a member?" : "New to Kifurushi?"}{" "}
          <button type="button" className="font-semibold text-[var(--forest)] underline"
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}>
            {mode === "signup" ? "Sign in" : "Create an account"}
          </button>
        </p>
      </form>

      <p className="mt-4 text-center text-xs text-[#8a8574]">
        Demo mode: accounts are stored only in this browser. Production uses
        Supabase Auth with email verification and row-level security.
      </p>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}
