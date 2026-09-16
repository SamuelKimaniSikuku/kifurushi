"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Eye, EyeOff, Gift, HeartHandshake, MailCheck, Package, Plane } from "lucide-react";
import { signInSchema, signUpSchema, zodErrors, FieldErrors } from "@/lib/validation";
import { safeReturnPath } from "@/lib/routes";
import { supabase } from "@/lib/supabase";
import { useT } from "@/lib/i18n";
import Link from "next/link";

function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const safeNext = safeReturnPath(params.get("next"));
  const requestedMode = params.get("mode");
  const [mode, setMode] = useState<"signin" | "signup">(requestedMode === "signin" ? "signin" : "signup");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const t = useT();
  const x = t.experience;

  useEffect(() => {
    setMode(requestedMode === "signin" ? "signin" : "signup");
    setErrors({});
    setAuthError(null);
    setTermsError(false);
    setShowPassword(false);
  }, [requestedMode]);

  function changeMode(value: "signin" | "signup") {
    setMode(value);
    setErrors({});
    setAuthError(null);
    setTermsError(false);
    setShowPassword(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setAuthError(null);
    if (mode === "signup" && !termsAccepted) {
      setTermsError(true);
      document.getElementById("terms")?.focus();
      return;
    }
    setTermsError(false);
    const parsed = (mode === "signup" ? signUpSchema : signInSchema).safeParse(form);
    if (!parsed.success) {
      const fieldErrors = zodErrors(parsed.error);
      setErrors(fieldErrors);
      document.getElementById(Object.keys(fieldErrors)[0])?.focus();
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
              full_name: "name" in parsed.data ? parsed.data.name : form.name.trim(),
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
    } catch {
      setAuthError(x.connectionError);
    } finally {
      setSubmitting(false);
    }
  }

  async function sendReset() {
    if (resetBusy) return;
    const email = form.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: t.auth.resetEnterEmail });
      document.getElementById("email")?.focus();
      return;
    }
    setErrors({});
    setAuthError(null);
    setResetBusy(true);
    try {
      // Always reports success: whether the address has an account is not
      // something this page should reveal.
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset`,
      });
      setResetSent(true);
    } catch {
      setAuthError(x.connectionError);
    } finally {
      setResetBusy(false);
    }
  }

  const passwordDescribedBy =
    [errors.password ? "password-error" : "", mode === "signup" ? "password-hint" : ""]
      .filter(Boolean)
      .join(" ") || undefined;

  if (resetSent) {
    return (
      <div className="mx-auto max-w-md px-4 py-14">
        <div className="card p-8 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-sand-deep">
            <MailCheck className="h-6 w-6 text-forest" strokeWidth={2} />
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-forest">
            {t.auth.checkEmailTitle}
          </h1>
          <p className="mt-2 text-sm text-muted">{t.auth.resetSentBody(form.email.trim())}</p>
          <p className="mt-4 text-sm text-muted">{x.checkSpam}</p>
          <button
            type="button"
            className="btn-ghost mt-6 w-full"
            onClick={() => {
              setResetSent(false);
              changeMode("signin");
            }}
          >
            {t.auth.backToSignIn}
          </button>
        </div>
      </div>
    );
  }

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
          <p className="mt-4 text-sm text-muted">{x.checkSpam}</p>
          <button
            type="button"
            className="btn-ghost mt-6 w-full"
            onClick={() => {
              setConfirmSent(false);
              changeMode("signin");
            }}
          >
            {t.auth.backToSignIn}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl items-start gap-8 px-4 py-10 md:grid-cols-2 md:gap-14 md:py-14">
      <aside className="rounded-3xl bg-forest-deep p-6 text-white md:sticky md:top-24 md:p-9">
        <div className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-gold"><Gift size={18} aria-hidden />{x.launch}</div>
        <h2 className="text-2xl font-bold leading-tight md:text-4xl">{x.authNote}</h2>
        <p className="mt-4 text-base leading-relaxed text-white/80">{x.authBody}</p>
        <div className="mt-7 hidden space-y-4 border-t border-white/15 pt-6 text-sm md:block">
          <p className="flex items-center gap-3"><Plane className="text-gold" size={19} aria-hidden />{t.roles.postTripDesc}</p>
          <p className="flex items-center gap-3"><Package className="text-gold" size={19} aria-hidden />{t.roles.postParcelDesc}</p>
          <p className="flex items-center gap-3"><HeartHandshake className="text-gold" size={19} aria-hidden />{x.commission}</p>
        </div>
      </aside>
      <div className="min-w-0">
      <h1 className="font-display text-3xl font-bold tracking-tight text-forest">
        {mode === "signup" ? t.auth.joinTitle : t.auth.welcomeBack}
      </h1>
      <p className="mt-2 text-base text-muted">
        {t.auth.subtitle}
      </p>

      <form onSubmit={submit} className="card mt-6 space-y-5 p-5 sm:p-7" noValidate aria-busy={submitting}>
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-sand p-1" role="group" aria-label={x.chooseRole}>
          {(["signup", "signin"] as const).map((value) => <button type="button" key={value} disabled={submitting} aria-pressed={mode === value} onClick={() => changeMode(value)} className={`min-h-11 rounded-lg px-2 py-2 text-sm font-semibold ${mode === value ? "bg-forest text-white shadow-sm" : "text-muted hover:text-forest"}`}>{value === "signup" ? t.auth.createAccount : t.auth.signIn}</button>)}
        </div>
        {mode === "signup" && (
          <div>
            <label className="field-label" htmlFor="name">{t.auth.fullName}</label>
            <input
              id="name"
              className={`field ${errors.name ? "field-invalid" : ""}`}
              autoComplete="name"
              required
              disabled={submitting}
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
            autoCapitalize="none"
            spellCheck={false}
            required
            disabled={submitting}
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
          <div className="flex items-baseline justify-between gap-2">
            <label className="field-label" htmlFor="password">{t.auth.password}</label>
            {mode === "signin" && (
              <button
                type="button"
                disabled={submitting || resetBusy}
                onClick={sendReset}
                className="-my-1 rounded px-1 py-1 text-sm font-semibold text-forest underline underline-offset-2 transition hover:text-forest-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf"
              >
                {resetBusy ? t.auth.oneMoment : t.auth.forgotPassword}
              </button>
            )}
          </div>
          <div className="relative"><input
            id="password"
            type={showPassword ? "text" : "password"}
            className={`field pr-14 ${errors.password ? "field-invalid" : ""}`}
            required
            disabled={submitting}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={form.password}
            aria-invalid={!!errors.password}
            aria-describedby={passwordDescribedBy}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <button type="button" className="absolute right-1 top-1 grid h-10 w-11 place-items-center rounded-lg text-muted hover:text-forest" aria-label={showPassword ? x.hidePassword : x.showPassword} aria-pressed={showPassword} onClick={() => setShowPassword((shown) => !shown)}>{showPassword ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}</button></div>
          {errors.password && (
            <p id="password-error" className="field-error">{errors.password}</p>
          )}
          {mode === "signup" && (
            <ul id="password-hint" className="mt-3 grid gap-x-3 gap-y-1 text-sm sm:grid-cols-2">
              {[[x.passwordLength, form.password.length >= 10], [x.passwordUpper, /[A-Z]/.test(form.password)], [x.passwordLower, /[a-z]/.test(form.password)], [x.passwordNumber, /[0-9]/.test(form.password)]].map(([label, met]) => <li key={String(label)} className={`flex items-center gap-1.5 ${met ? "text-success" : "text-muted"}`}><Check size={15} aria-hidden className={met ? "opacity-100" : "opacity-30"} /><span>{label}</span></li>)}
            </ul>
          )}
        </div>

        {mode === "signup" && (
          <div>
            <label
              htmlFor="terms"
              className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl py-1 text-sm leading-relaxed text-muted focus-within:ring-2 focus-within:ring-leaf"
            >
              <input
                id="terms"
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 accent-forest"
                checked={termsAccepted}
                disabled={submitting}
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
                {" "}<Link href="/privacy" target="_blank" className="font-semibold text-forest underline">{x.privacy}</Link>
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

        <p className="text-center text-sm text-muted">
          {mode === "signup" ? t.auth.alreadyMember : t.auth.newTo}{" "}
          <button
            type="button"
            disabled={submitting}
            className="-my-2 inline-flex min-h-[44px] items-center rounded-lg px-1.5 py-2 font-semibold text-forest underline transition hover:text-forest-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2"
            onClick={() => {
              changeMode(mode === "signup" ? "signin" : "signup");
            }}
          >
            {mode === "signup" ? t.auth.signIn : t.auth.createLink}
          </button>
        </p>
      </form>
      </div>
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
