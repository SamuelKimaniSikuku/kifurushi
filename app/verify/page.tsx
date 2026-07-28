"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookUser, Car, Check, CreditCard, Loader2, Lock, ShieldCheck, Upload,
} from "lucide-react";
import {
  getVerification, submitVerification, approveVerification, Verification,
} from "@/lib/store";
import { fetchSession } from "@/lib/auth";
import { verificationSchema, validateUpload, zodErrors, FieldErrors } from "@/lib/validation";

const ID_TYPES = [
  { value: "passport", label: "Passport", Icon: BookUser },
  { value: "national_id", label: "National ID card", Icon: CreditCard },
  { value: "drivers_licence", label: "Driver's licence", Icon: Car },
];

const STEPS = ["Phone", "ID document", "Selfie"];

export default function VerifyPage() {
  const router = useRouter();
  const [verification, setVerification] = useState<Verification | null>(null);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [phone, setPhone] = useState("");
  const [idType, setIdType] = useState("");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchSession().then((s) => {
      if (!mounted) return;
      if (!s) {
        router.replace("/auth?next=/verify");
        return;
      }
      setVerification(getVerification());
    });
    return () => {
      mounted = false;
    };
  }, [router]);

  if (!verification) return null;

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

  function nextFromStep2() {
    const errs: FieldErrors = {};
    if (!idType) errs.idType = "Pick an ID type";
    const idErr = validateUpload(idFile, "ID photo");
    if (idErr) errs.idFile = idErr;
    if (Object.keys(errs).length) return setErrors(errs);
    setErrors({});
    setStep(3);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: FieldErrors = {};
    const selfieErr = validateUpload(selfieFile, "Selfie");
    if (selfieErr) errs.selfieFile = selfieErr;
    const parsed = verificationSchema.safeParse({ phone, idType, consent });
    if (!parsed.success) Object.assign(errs, zodErrors(parsed.error));
    if (Object.keys(errs).length) return setErrors(errs);

    setErrors({});
    setProcessing(true);
    submitVerification(phone, idType);
    // Demo: simulate the KYC provider's asynchronous approval webhook.
    // In production this state change comes from the server, never the client.
    setTimeout(() => {
      setVerification(approveVerification());
      setProcessing(false);
    }, 2500);
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
            <div>
              <label className="field-label" htmlFor="idFile">Photo of your ID</label>
              <label
                htmlFor="idFile"
                className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed p-4 transition hover:border-forest focus-within:ring-2 focus-within:ring-leaf ${
                  errors.idFile ? "border-danger" : "border-line-strong"
                }`}
              >
                <input
                  id="idFile" type="file" accept="image/jpeg,image/png,image/webp,image/heic"
                  className="sr-only"
                  aria-invalid={!!errors.idFile}
                  aria-describedby={errors.idFile ? "idFile-error idFile-hint" : "idFile-hint"}
                  onChange={(e) => setIdFile(e.target.files?.[0] ?? null)}
                />
                <span
                  aria-hidden
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sand-deep text-forest"
                >
                  <Upload className="h-[18px] w-[18px]" strokeWidth={2} />
                </span>
                <span className="min-w-0 truncate text-sm font-semibold text-ink">
                  {idFile ? idFile.name : "Choose a photo of your ID"}
                </span>
              </label>
              {errors.idFile && <p id="idFile-error" className="field-error">{errors.idFile}</p>}
              <p id="idFile-hint" className="mt-1 text-xs text-muted">
                All four corners visible, no glare. JPEG/PNG/WebP/HEIC, max 8 MB.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-ghost min-h-[44px] flex-1"
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <button
                type="button"
                className="btn-primary min-h-[44px] flex-1"
                onClick={nextFromStep2}
              >
                Continue
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div>
              <label className="field-label" htmlFor="selfieFile">Selfie</label>
              <label
                htmlFor="selfieFile"
                className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed p-4 transition hover:border-forest focus-within:ring-2 focus-within:ring-leaf ${
                  errors.selfieFile ? "border-danger" : "border-line-strong"
                }`}
              >
                <input
                  id="selfieFile" type="file" accept="image/jpeg,image/png,image/webp,image/heic"
                  capture="user" className="sr-only"
                  aria-invalid={!!errors.selfieFile}
                  aria-describedby={
                    errors.selfieFile ? "selfieFile-error selfieFile-hint" : "selfieFile-hint"
                  }
                  onChange={(e) => setSelfieFile(e.target.files?.[0] ?? null)}
                />
                <span
                  aria-hidden
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sand-deep text-forest"
                >
                  <Upload className="h-[18px] w-[18px]" strokeWidth={2} />
                </span>
                <span className="min-w-0 truncate text-sm font-semibold text-ink">
                  {selfieFile ? selfieFile.name : "Take or choose a selfie"}
                </span>
              </label>
              {errors.selfieFile && (
                <p id="selfieFile-error" className="field-error">{errors.selfieFile}</p>
              )}
              <p id="selfieFile-hint" className="mt-1 text-xs text-muted">
                Plain background, face uncovered — it&apos;s matched against your ID photo.
              </p>
            </div>

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
                I consent to my ID and selfie being checked by Kifurushi&apos;s identity
                partner. Images are sent directly to the verification provider and
                are never stored by Kifurushi.
              </span>
            </label>
            {errors.consent && <p id="consent-error" className="field-error">{errors.consent}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                className="btn-ghost min-h-[44px] flex-1"
                onClick={() => setStep(2)}
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
                    Checking…
                  </>
                ) : (
                  "Submit for verification"
                )}
              </button>
            </div>
            {processing && (
              <p className="text-center text-xs text-muted">
                Demo: simulating the identity provider&apos;s check (~2 s). In
                production this is Smile ID / Stripe Identity and takes seconds
                to minutes.
              </p>
            )}
          </>
        )}
      </form>

      <p className="mt-4 flex items-start justify-center gap-1.5 text-center text-xs text-faint">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
        <span>
          Demo mode never uploads or stores your images — only the pass/fail
          outcome is kept, which is also the production policy.
        </span>
      </p>
    </div>
  );
}
