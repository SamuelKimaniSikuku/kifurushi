"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getSession, getVerification, submitVerification, approveVerification,
  Verification,
} from "@/lib/store";
import { verificationSchema, validateUpload, zodErrors, FieldErrors } from "@/lib/validation";

const ID_TYPES = [
  { value: "passport", label: "🛂 Passport" },
  { value: "national_id", label: "🪪 National ID card" },
  { value: "drivers_licence", label: "🚗 Driver's licence" },
];

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
    if (!getSession()) {
      router.replace("/auth?next=/verify");
      return;
    }
    setVerification(getVerification());
  }, [router]);

  if (!verification) return null;

  if (verification.status === "verified") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-3xl">✓</div>
        <h1 className="mt-4 text-3xl font-extrabold text-[var(--forest)]">You&apos;re verified</h1>
        <p className="mt-2 text-sm text-[#5c6b63]">
          Your profile now shows the ✓ Verified badge on every trip and parcel
          you post. Senders and travellers see it before agreeing to a match.
        </p>
        <button className="btn-primary mt-6" onClick={() => router.push("/dashboard")}>
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
      <h1 className="text-3xl font-extrabold text-[var(--forest)]">Get verified</h1>
      <p className="mt-1 text-sm text-[#5c6b63]">
        Required before your first carry — takes about two minutes.
      </p>

      {/* Step indicator */}
      <div className="mt-6 flex items-center gap-2">
        {["Phone", "ID document", "Selfie"].map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-extrabold ${
              step > i + 1 ? "bg-emerald-500 text-white"
              : step === i + 1 ? "bg-[var(--forest)] text-white"
              : "bg-[var(--sand-deep)] text-[#8a8574]"
            }`}>
              {step > i + 1 ? "✓" : i + 1}
            </span>
            <span className={`text-xs font-semibold ${step === i + 1 ? "text-[var(--forest)]" : "text-[#8a8574]"}`}>
              {label}
            </span>
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="card mt-6 space-y-5 p-6" noValidate>
        {step === 1 && (
          <>
            <div>
              <label className="field-label" htmlFor="phone">Mobile number</label>
              <input
                id="phone" type="tel" className="field" placeholder="+254712345678"
                autoComplete="tel" value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              {errors.phone && <p className="field-error">{errors.phone}</p>}
              <p className="mt-1 text-xs text-[#5c6b63]">
                We&apos;ll text a code to this number. It&apos;s shared with your match
                only after both sides confirm.
              </p>
            </div>
            <button type="button" className="btn-primary w-full" onClick={nextFromStep1}>
              Continue
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <label className="field-label">ID type</label>
              <div className="grid gap-2 sm:grid-cols-3">
                {ID_TYPES.map((t) => (
                  <button
                    key={t.value} type="button" onClick={() => setIdType(t.value)}
                    className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${
                      idType === t.value
                        ? "border-[var(--forest)] bg-[var(--forest)] text-white"
                        : "border-[#d8cfbc] bg-white text-[#4a5a51]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {errors.idType && <p className="field-error">{errors.idType}</p>}
            </div>
            <div>
              <label className="field-label" htmlFor="idFile">Photo of your ID</label>
              <input
                id="idFile" type="file" accept="image/jpeg,image/png,image/webp,image/heic"
                className="field"
                onChange={(e) => setIdFile(e.target.files?.[0] ?? null)}
              />
              {errors.idFile && <p className="field-error">{errors.idFile}</p>}
              <p className="mt-1 text-xs text-[#5c6b63]">
                All four corners visible, no glare. JPEG/PNG/WebP/HEIC, max 8 MB.
              </p>
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn-ghost flex-1" onClick={() => setStep(1)}>Back</button>
              <button type="button" className="btn-primary flex-1" onClick={nextFromStep2}>Continue</button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div>
              <label className="field-label" htmlFor="selfieFile">Selfie</label>
              <input
                id="selfieFile" type="file" accept="image/jpeg,image/png,image/webp,image/heic"
                capture="user" className="field"
                onChange={(e) => setSelfieFile(e.target.files?.[0] ?? null)}
              />
              {errors.selfieFile && <p className="field-error">{errors.selfieFile}</p>}
              <p className="mt-1 text-xs text-[#5c6b63]">
                Plain background, face uncovered — it&apos;s matched against your ID photo.
              </p>
            </div>

            <label className="flex items-start gap-2 text-xs text-[#4a5a51]">
              <input
                type="checkbox" className="mt-0.5" checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              I consent to my ID and selfie being checked by Kifurushi&apos;s identity
              partner. Images are sent directly to the verification provider and
              are never stored by Kifurushi.
            </label>
            {errors.consent && <p className="field-error">{errors.consent}</p>}

            <div className="flex gap-2">
              <button type="button" className="btn-ghost flex-1" onClick={() => setStep(2)} disabled={processing}>
                Back
              </button>
              <button type="submit" className="btn-accent flex-1" disabled={processing}>
                {processing ? "Checking…" : "Submit for verification"}
              </button>
            </div>
            {processing && (
              <p className="text-center text-xs text-[#5c6b63]">
                Demo: simulating the identity provider&apos;s check (~2 s). In
                production this is Smile ID / Stripe Identity and takes seconds
                to minutes.
              </p>
            )}
          </>
        )}
      </form>

      <p className="mt-4 text-center text-xs text-[#8a8574]">
        🔒 Demo mode never uploads or stores your images — only the pass/fail
        outcome is kept, which is also the production policy.
      </p>
    </div>
  );
}
