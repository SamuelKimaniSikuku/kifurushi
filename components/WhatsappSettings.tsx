"use client";

// The dashboard's opt-in WhatsApp number. Off by default — no row, nothing
// anyone can see. The hint spells out the whole privacy contract in one
// sentence: matched counterparty, after acceptance, never public.

import { useEffect, useState } from "react";
import { Check, MessageCircle } from "lucide-react";
import { fetchMyWhatsapp, saveMyWhatsapp } from "@/lib/db";
import { useT } from "@/lib/i18n";

const E164 = /^\+[1-9][0-9]{6,14}$/;

export default function WhatsappSettings() {
  const t = useT();
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
      setTimeout(() => setJustSaved(false), 4000);
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
    } catch {
      // Leave the current state on screen; retry is a click away.
    } finally {
      setBusy(false);
    }
  }

  if (!loaded) return null;

  return (
    <div id="whatsapp" className="card mt-6 scroll-mt-24 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-forest">
        <MessageCircle className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
        {t.browse.waTitle}
      </div>
      <p className="mt-1 text-xs text-muted">{t.browse.waHint}</p>
      <div className="mt-3 flex flex-wrap items-start gap-2">
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
          {error && <p className="field-error">{error}</p>}
          {justSaved && (
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-success">
              <Check size={13} strokeWidth={2.5} aria-hidden />
              {t.browse.waSaved}
            </p>
          )}
        </div>
        <button
          type="button"
          className="btn-primary min-h-[44px] shrink-0"
          disabled={busy || value.replace(/[\s()-]/g, "") === (savedNumber ?? "")}
          onClick={save}
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
    </div>
  );
}
