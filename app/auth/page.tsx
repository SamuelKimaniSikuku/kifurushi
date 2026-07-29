"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";
import { signUpSchema, zodErrors, FieldErrors } from "@/lib/validation";
import { supabase } from "@/lib/supabase";
import { useT } from "@/lib/i18n";
import Link from "next/link";

function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const safeNext = next.startsWith("/") ? next : "/dashboard";
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const t = useT();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    if (mode === "signup" && !termsAccepted) {
      setTermsError(true);
      return;
    }
    setTermsError(false);
    const parsed = signUpSchema.safeParse(
      mode === "signin" ? { ...form, name: form.name || "Member" } : form
    );
    if (!parsed.success) {
      setErrors(zodErrors(parsed.error));
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: form.password,
          options: {
            data: {
              full_name: parsed.data.name,
              terms_accepted_at: new Date().toISOString(),
            },
          },
        });
        if (error) {
          setAuthError(error.message);
          return;
        }
        // Email confirmation on: no session until the link is clicked.
        if (!data.session) {
          setConfirmSent(true);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: form.password,
        });
        if (error) {
          setAuthError(
            error.message === "Invalid login credentials"
              ? t.auth.wrongCreds
              : error.message
          );
          return;
        }
      }
      router.push(safeNext);
    } finally {
      setSubmitting(false);
    }
  }

  const passwordDescribedBy =
    [errors.password ? "password-error" : "", mode === "signup" ? "password-hint" : ""]
      .filter(Boolean)
      .join(" ") || undefined;

  if (confirmSent) {
    return (
      <div className="mx-auto max-w-md px-4 py-14">
        <div className="card p-8 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-sand-deep">
            <MailCheck className="h-6 w-6 text-forest" strokeWidth={2} />
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-forest">
            {t.auth.checkEmailTitle}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {t.auth.checkEmailBody1} <b className="text-ink">{form.email}</b>.{" "}
            {t.auth.checkEmailBody2}
          </p>
          <button
            type="button"
            className="btn-ghost mt-6 w-full"
            onClick={() => {
              setConfirmSent(false);
              setMode("signin");
            }}
          >
            {t.auth.backToSignIn}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="text-center font-display text-3xl font-bold tracking-tight text-forest md:text-4xl">
        {mode === "signup" ? t.auth.joinTitle : t.auth.welcomeBack}
      </h1>
      <p className="mt-2 text-center text-sm text-muted">
        {t.auth.subtitle}
      </p>

      <form onSubmit={submit} className="card mt-6 space-y-4 p-6 sm:p-8" noValidate>
        {mode === "signup" && (
          <div>
            <label className="field-label" htmlFor="name">{t.auth.fullName}</label>
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
          <label className="field-label" htmlFor="email">{t.auth.email}</label>
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
          <label className="field-label" htmlFor="password">{t.auth.password}</label>
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
              {t.auth.passwordHint}
            </p>
          )}
        </div>

        {mode === "signup" && (
          <div>
            <label
              htmlFor="terms"
              className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl py-1 text-xs text-muted focus-within:ring-2 focus-within:ring-leaf"
            >
              <input
                id="terms"
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 accent-forest"
                checked={termsAccepted}
                aria-invalid={termsError || undefined}
                aria-describedby={termsError ? "terms-error" : undefined}
                onChange={(e) => {
                  setTermsAccepted(e.target.checked);
                  if (e.target.checked) setTermsError(false);
                }}
              />
              <span>
                {t.auth.termsAgree1}{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  className="font-semibold text-forest underline"
                >
                  {t.auth.termsLink}
                </Link>{" "}
                {t.auth.termsAgree2}
              </span>
            </label>
            {termsError && (
              <p id="terms-error" role="alert" className="field-error">
                {t.auth.termsError}
              </p>
            )}
          </div>
        )}

        {authError && (
          <p role="alert" className="field-error">{authError}</p>
        )}

        <button type="submit" className="btn-primary w-full py-3" disabled={submitting}>
          {submitting
            ? t.auth.oneMoment
            : mode === "signup"
              ? t.auth.createAccount
              : t.auth.signIn}
        </button>

        <p className="text-center text-xs text-muted">
          {mode === "signup" ? t.auth.alreadyMember : t.auth.newTo}{" "}
          <button
            type="button"
            className="-my-2 inline-flex min-h-[44px] items-center rounded-lg px-1.5 py-2 font-semibold text-forest underline transition hover:text-forest-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2"
            onClick={() => {
              setMode(mode === "signup" ? "signin" : "signup");
              setErrors({});
              setAuthError(null);
            }}
          >
            {mode === "signup" ? t.auth.signIn : t.auth.createLink}
          </button>
        </p>
      </form>
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
