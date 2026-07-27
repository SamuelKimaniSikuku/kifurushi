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

  const passwordDescribedBy =
    [errors.password ? "password-error" : "", mode === "signup" ? "password-hint" : ""]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="text-center font-display text-3xl font-bold tracking-tight text-forest md:text-4xl">
        {mode === "signup" ? "Join Kifurushi" : "Welcome back"}
      </h1>
      <p className="mt-2 text-center text-sm text-muted">
        One account for sending and travelling.
      </p>

      <form onSubmit={submit} className="card mt-6 space-y-4 p-6 sm:p-8" noValidate>
        {mode === "signup" && (
          <div>
            <label className="field-label" htmlFor="name">Full name</label>
            <input
              id="name"
              className={`field ${errors.name ? "field-invalid" : ""}`}
              autoComplete="name"
              value={form.name}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            {errors.name && (
              <p id="name-error" className="field-error">{errors.name}</p>
            )}
          </div>
        )}
        <div>
          <label className="field-label" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className={`field ${errors.email ? "field-invalid" : ""}`}
            autoComplete="email"
            value={form.email}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          {errors.email && (
            <p id="email-error" className="field-error">{errors.email}</p>
          )}
        </div>
        <div>
          <label className="field-label" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className={`field ${errors.password ? "field-invalid" : ""}`}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={form.password}
            aria-invalid={!!errors.password}
            aria-describedby={passwordDescribedBy}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          {errors.password && (
            <p id="password-error" className="field-error">{errors.password}</p>
          )}
          {mode === "signup" && (
            <p id="password-hint" className="mt-1 text-xs text-muted">
              At least 10 characters with upper, lower and a number.
            </p>
          )}
        </div>

        <button type="submit" className="btn-primary w-full py-3">
          {mode === "signup" ? "Create account" : "Sign in"}
        </button>

        <p className="text-center text-xs text-muted">
          {mode === "signup" ? "Already a member?" : "New to Kifurushi?"}{" "}
          <button
            type="button"
            className="-my-2 inline-flex min-h-[44px] items-center rounded-lg px-1.5 py-2 font-semibold text-forest underline transition hover:text-forest-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2"
            onClick={() => {
              setMode(mode === "signup" ? "signin" : "signup");
              setErrors({});
            }}
          >
            {mode === "signup" ? "Sign in" : "Create an account"}
          </button>
        </p>
      </form>

      <p className="mt-4 text-center text-xs text-faint">
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
