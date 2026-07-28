"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookUser, Car, Check, CreditCard, Loader2, Lock, ShieldCheck,
} from "lucide-react";
import {
  fetchVerification, submitVerification, VerificationState,
} from "@/lib/db";
import { fetchSession } from "@/lib/auth";
import { verificationSchema, zodErrors, FieldErrors } from "@/lib/validation";

const ID_TYPES = [
  { value: "passport", label: "Passport", Icon: BookUser },
  { value: "national_id", label: "National ID card", Icon: CreditCard },
  { value: "drivers_licence", label: "Driver's licence", Icon: Car },
];

const STEPS = ["Phone", "Identity check"];

export default function VerifyPage() {
  const router = useRouter();
  const [verification, setVerification] = useState<VerificationState | null>(null);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [phone, setPhone] = useState("");
  const [idType, setIdType] = useState("");
  const [consent, setConsent] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchSession().then(async (s) => {
      if (!mounted) return;
      if (!s) {
        router.replace("/auth?next=/verify");
        return;
      }
      const v = await fetchVerification().catch(() => null);
      if (mounted && v) setVerification(v);
    });
    return () => {
      mounted = false;
    };
  }, [router]);

  if (!verification) return null;

  if (verification.status === "pending") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-sand-deep text-forest">
          <ShieldCheck className="h-8 w-8" strokeWidth={2} aria-hidden />
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-forest md:text-4xl">
          Verification in progress
        </h1>
        <p className="mt-2 text-sm text-muted">
          Your identity check is being processed — the ✓ Verified badge appears
          on your profile as soon as it&apos;s approved, usually within minutes.
        </p>
        <button
          className="btn-primary mt-6 min-h-[44px]"
          onClick={() => router.push("/dashboard")}
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  if (verification.status === "verified") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success-bg text-success">
          <ShieldCheck className="h-8 w-8" strokeWidth={2} aria-hidden />
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-forest md:text-4xl">
          You&apos;re verified
        </h1>
        <p className="mt-2 text-sm text-muted">
          Your profile now shows the ✓ Verified badge on every trip and parcel
          you post. Senders and travellers see it before agreeing to a match.
        </p>
        <button
          className="btn-primary mt-6 min-h-[44px]"
          onClick={() => router.push("/dashboard")}
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  function nextFromStep1() {
    const parsed = verificationSchema.pick({ phone: true }).safeParse({ phone });
    if (!parsed.success) return setErrors(zodErrors(parsed.error));
    setErrors({});
    setStep(2);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = verificationSchema.safeParse({ phone, idType, consent });
    if (!parsed.success) return setErrors(zodErrors(parsed.error));

    setErrors({});
    setProcessing(true);
    try {
      // Hand off to Didit's hosted flow — ID photo and selfie are captured
      // there and never touch Kifurushi.
      window.location.href = await submitVerification(phone, idType);
    } catch {
      setErrors({ consent: "Could not start the identity check — please try again." });
      setProcessing(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold tracking-tight text-forest md:text-4xl">
        Get verified
      </h1>
      <p className="mt-1 text-sm text-muted">
        Required before your first carry — takes about two minutes.
      </p>

      {/* Step indicator */}
      <ol className="mt-6 flex items-center">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = step > n;
          const current = step === n;
          return (
            <li
              key={label}
              className={`flex items-center gap-2 ${i < STEPS.length - 1 ? "flex-1" : ""}`}
              aria-current={current ? "step" : undefined}
            >
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                  done ? "bg-leaf text-white"
                  : current ? "bg-forest text-white"
                  : "bg-sand-deep text-muted"
                }`}
              >
                {done ? <Check className="h-4 w-4" strokeWidth={2} aria-hidden /> : n}
              </span>
              <span
                className={`whitespace-nowrap text-xs font-semibold ${
                  current ? "text-forest" : "text-muted"
                }`}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className={`mx-1 flex-1 border-t ${done ? "border-leaf" : "border-line"}`}
                />
              )}
            </li>
          );
        })}
      </ol>

      <form onSubmit={submit} className="card mt-6 space-y-5 p-6 sm:p-8" noValidate>
        {step === 1 && (
          <>
            <div>
              <label className="field-label" htmlFor="phone">Mobile number</label>
              <input
                id="phone" type="tel" placeholder="+254712345678"
                className={`field ${errors.phone ? "field-invalid" : ""}`}
                autoComplete="tel" value={phone}
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "phone-error phone-hint" : "phone-hint"}
                onChange={(e) => setPhone(e.target.value)}
              />
              {errors.phone && <p id="phone-error" className="field-error">{errors.phone}</p>}
              <p id="phone-hint" className="mt-1 text-xs text-muted">
                We&apos;ll text a code to this number. It&apos;s shared with your match
                only after both sides confirm.
              </p>
            </div>
            <button
              type="button"
              className="btn-primary min-h-[44px] w-full"
              onClick={nextFromStep1}
            >
              Continue
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <span className="field-label" id="idType-label">ID type</span>
              <div
                role="group"
                aria-labelledby="idType-label"
                aria-describedby={errors.idType ? "idType-error" : undefined}
                className="grid gap-2 sm:grid-cols-3"
              >
                {ID_TYPES.map((t) => {
                  const selected = idType === t.value;
                  return (
                    <button
                      key={t.value} type="button" onClick={() => setIdType(t.value)}
                      aria-pressed={selected}
                      className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 ${
                        selected
                          ? "border-forest bg-forest text-white"
                          : "border-line-strong bg-white text-ink hover:border-forest"
                      }`}
                    >
                      {selected ? (
                        <Check className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                      ) : (
                        <t.Icon className="h-4 w-4 shrink-0 text-clay" strokeWidth={2} aria-hidden />
                      )}
                      {t.label}
                    </button>
                  );
                })}
              </div>
              {errors.idType && <p id="idType-error" className="field-error">{errors.idType}</p>}
            </div>

            <p className="rounded-xl bg-sand p-4 text-xs text-muted">
              Next you&apos;ll be taken to our identity partner{" "}
              <b className="text-ink">Didit</b> to photograph your ID and take a
              quick selfie. It takes about two minutes and works on any phone or
              laptop with a camera.
            </p>

            <label
              htmlFor="consent"
              className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl py-2 text-xs text-muted focus-within:ring-2 focus-within:ring-leaf"
            >
              <input
                id="consent" type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-forest"
                checked={consent}
                aria-invalid={!!errors.consent}
                aria-describedby={errors.consent ? "consent-error" : undefined}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>
                I consent to my ID and selfie being checked by Didit,
                Kifurushi&apos;s identity partner. Images go directly to Didit and
                are never stored by Kifurushi — we keep only the pass/fail
                outcome.
              </span>
            </label>
            {errors.consent && <p id="consent-error" className="field-error">{errors.consent}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                className="btn-ghost min-h-[44px] flex-1"
                onClick={() => setStep(1)}
                disabled={processing}
              >
                Back
              </button>
              <button
                type="submit"
                className="btn-accent min-h-[44px] flex-1"
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden />
                    Starting…
                  </>
                ) : (
                  "Start identity check"
                )}
              </button>
            </div>
          </>
        )}
      </form>

      <p className="mt-4 flex items-start justify-center gap-1.5 text-center text-xs text-faint">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
        <span>
          Kifurushi never stores your images — only the pass/fail outcome is
          kept on your account.
        </span>
      </p>
    </div>
  );
}
