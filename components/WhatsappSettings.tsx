"use client";

// The dashboard's opt-in WhatsApp number. Off by default — no row, nothing
// anyone can see. The hint spells out the whole privacy contract in one
// sentence: matched counterparty, after acceptance, never public.

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, MessageCircle } from "lucide-react";
import { fetchMyWhatsapp, saveMyWhatsapp } from "@/lib/db";
import PhoneVerification from "@/components/PhoneVerification";
import { useLang, useT } from "@/lib/i18n";
import { accountCopy } from "@/lib/locales/account";

const E164 = /^\+[1-9][0-9]{6,14}$/;

export default function WhatsappSettings() {
  const t = useT();
  const { lang } = useLang();
  const c = accountCopy[lang];
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [value, setValue] = useState("");
  const [savedNumber, setSavedNumber] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    let live = true;
    fetchMyWhatsapp()
      .then((n) => {
        if (!live) return;
        setSavedNumber(n);
        setValue(n ?? "");
      })
      .catch(() => {})
      .finally(() => live && setLoaded(true));
    return () => {
      live = false;
    };
  }, []);

  // Existing handover links still open the number editor directly, including
  // when contact details arrive after the dashboard's initial scroll.
  useEffect(() => {
    if (!loaded) return;
    const openFromLink = () => {
      if (window.location.hash !== "#whatsapp" || !detailsRef.current) return;
      detailsRef.current.open = true;
      detailsRef.current.scrollIntoView({ block: "start" });
    };
    openFromLink();
    window.addEventListener("hashchange", openFromLink);
    return () => window.removeEventListener("hashchange", openFromLink);
  }, [loaded]);

  useEffect(() => {
    if (!justSaved) return;
    const timer = setTimeout(() => setJustSaved(false), 4000);
    return () => clearTimeout(timer);
  }, [justSaved]);

  function closeEditor() {
    if (!detailsRef.current) return;
    detailsRef.current.open = false;
    detailsRef.current.querySelector("summary")?.focus();
  }

  async function save() {
    if (busy) return;
    const normalized = value.replace(/[\s()-]/g, "");
    if (!E164.test(normalized)) {
      setError(t.browse.waInvalid);
      return;
    }
    setError("");
    setBusy(true);
    try {
      await saveMyWhatsapp(normalized);
      setSavedNumber(normalized);
      setValue(normalized);
      setJustSaved(true);
      closeEditor();
    } catch {
      setError(t.browse.waInvalid);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await saveMyWhatsapp(null);
      setSavedNumber(null);
      setValue("");
      setJustSaved(false);
      closeEditor();
    } catch {
      // Leave the current state on screen; retry is a click away.
    } finally {
      setBusy(false);
    }
  }

  if (!loaded) return <p className="border-t border-line px-5 py-4 text-xs text-muted">{c.loading}</p>;

  return (
    <details ref={detailsRef} id="whatsapp" className="group scroll-mt-24 border-t border-line">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-5 [&::-webkit-details-marker]:hidden">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sand text-forest" aria-hidden>
          <MessageCircle size={18} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <span className="text-sm font-semibold">{c.whatsapp}</span>
          <p className="mt-0.5 break-words text-xs text-muted">{savedNumber ?? c.optional}</p>
          {justSaved && <p role="status" className="mt-1 flex items-center gap-1 text-xs text-success"><Check size={13} aria-hidden />{t.browse.waSaved}</p>}
        </div>
        <span className="text-sm font-semibold text-forest">
          <span className="group-open:hidden">{savedNumber ? c.edit : c.add}</span>
          <span className="hidden group-open:inline">{c.close}</span>
        </span>
        <ChevronDown size={16} className="shrink-0 text-muted transition group-open:rotate-180" aria-hidden />
      </summary>
      <div className="px-5 pb-5">
      <p className="text-xs leading-relaxed text-muted">{t.browse.waHint}</p>
      <form className="mt-3 flex flex-wrap items-start gap-2" onSubmit={(e) => { e.preventDefault(); void save(); }}>
        <div className="min-w-0 flex-1">
          <input
            aria-label={t.browse.waTitle}
            className={`field ${error ? "field-invalid" : ""}`}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder={t.browse.waPlaceholder}
            value={value}
            disabled={busy}
            onChange={(e) => setValue(e.target.value)}
          />
          {error && <p role="alert" className="field-error">{error}</p>}
        </div>
        <div className="flex w-full flex-wrap gap-2">
        <button
          type="submit"
          className="btn-primary min-h-[44px] shrink-0"
          disabled={busy || value.replace(/[\s()-]/g, "") === (savedNumber ?? "")}
        >
          {t.browse.waSave}
        </button>
        {savedNumber && (
          <button
            type="button"
            className="btn-ghost min-h-[44px] shrink-0"
            disabled={busy}
            onClick={remove}
          >
            {t.browse.waRemove}
          </button>
        )}
        </div>
      </form>
      {savedNumber && <PhoneVerification key={savedNumber} phone={savedNumber} />}
      </div>
    </details>
  );
}
