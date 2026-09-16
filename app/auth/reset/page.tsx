"use client";

// Where the "Forgot password?" email link lands. Supabase's recovery link
// signs the visitor in for one short-lived session; this page lets them set
// the new password and walks them straight into the dashboard. Arriving
// without that session (link expired, reused, or opened cold) gets an honest
// explanation and a way to request a fresh link — never a dead end.

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Eye, EyeOff, KeyRound } from "lucide-react";
import { signUpSchema } from "@/lib/validation";
import { supabase } from "@/lib/supabase";
import { useT } from "@/lib/i18n";

function ResetForm() {
  const router = useRouter();
  const t = useT();
  const x = t.experience;
  const [phase, setPhase] = useState<"checking" | "ready" | "expired" | "done">(
    "checking"
  );
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // The client exchanges the link's code for a session asynchronously after
  // load, so listen rather than check once; give it a few seconds before
  // declaring the link dead.
  useEffect(() => {
    let settled = false;
    const settle = (ok: boolean) => {
      if (settled) return;
      settled = true;
      setPhase((p) => (p === "checking" ? (ok ? "ready" : "expired") : p));
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) settle(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) settle(true);
    });
    const timer = setTimeout(() => settle(false), 5000);
    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const parsed = signUpSchema.shape.password.safeParse(password);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t.auth.passwordHint);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: parsed.data,
      });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setPhase("done");
      router.push("/dashboard");
    } catch {
      setError(x.connectionError);
    } finally {
      setBusy(false);
    }
  }

  if (phase === "checking") {
    return (
      <div className="mx-auto max-w-md px-4 py-14">
        <div className="card p-8 text-center text-sm text-muted" aria-busy="true">
          {t.auth.oneMoment}
        </div>
      </div>
    );
  }

  if (phase === "expired") {
    return (
      <div className="mx-auto max-w-md px-4 py-14">
        <div className="card p-8 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-sand-deep">
            <KeyRound className="h-6 w-6 text-forest" strokeWidth={2} />
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-forest">
            {t.auth.resetExpiredTitle}
          </h1>
          <p className="mt-2 text-sm text-muted">{t.auth.resetExpiredBody}</p>
          <Link href="/auth?mode=signin" className="btn-primary mt-6 w-full">
            {t.auth.requestNewLink}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="font-display text-3xl font-bold tracking-tight text-forest">
        {t.auth.resetTitle}
      </h1>
      <p className="mt-2 text-base text-muted">{t.auth.resetSub}</p>

      <form onSubmit={submit} className="card mt-6 space-y-5 p-5 sm:p-7" noValidate aria-busy={busy}>
        <div>
          <label className="field-label" htmlFor="new-password">
            {t.auth.newPassword}
          </label>
          <div className="relative">
            <input
              id="new-password"
              type={showPassword ? "text" : "password"}
              className={`field pr-14 ${error ? "field-invalid" : ""}`}
              autoComplete="new-password"
              required
              disabled={busy || phase === "done"}
              value={password}
              aria-invalid={!!error}
              aria-describedby="new-password-hint"
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute right-1 top-1 grid h-10 w-11 place-items-center rounded-lg text-muted hover:text-forest"
              aria-label={showPassword ? x.hidePassword : x.showPassword}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((shown) => !shown)}
            >
              {showPassword ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
            </button>
          </div>
          <ul id="new-password-hint" className="mt-3 grid gap-x-3 gap-y-1 text-sm sm:grid-cols-2">
            {[
              [x.passwordLength, password.length >= 10],
              [x.passwordUpper, /[A-Z]/.test(password)],
              [x.passwordLower, /[a-z]/.test(password)],
              [x.passwordNumber, /[0-9]/.test(password)],
            ].map(([label, met]) => (
              <li
                key={String(label)}
                className={`flex items-center gap-1.5 ${met ? "text-success" : "text-muted"}`}
              >
                <Check size={15} aria-hidden className={met ? "opacity-100" : "opacity-30"} />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>

        {error && (
          <p role="alert" className="field-error">{error}</p>
        )}

        <button type="submit" className="btn-primary w-full py-3" disabled={busy || phase === "done"}>
          {phase === "done" ? t.auth.resetDone : busy ? t.auth.oneMoment : t.auth.resetSave}
        </button>
      </form>
    </div>
  );
}

export default function ResetPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
