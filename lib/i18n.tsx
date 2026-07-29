"use client";

// Lightweight client-side i18n. Every page is a client component, so a
// context + same-shaped dictionary per language covers the app without
// route changes. The visitor's browser language picks the default
// (fr → French, sw → Swahili), the nav switcher overrides it, and the
// choice persists in localStorage.

import {
  createContext, useCallback, useContext, useEffect, useState,
} from "react";
import { supabase } from "./supabase";
import { en, type Dict } from "./locales/en";

export type { Dict } from "./locales/en";
import { fr } from "./locales/fr";
import { sw } from "./locales/sw";

export type Lang = "en" | "fr" | "sw";

const DICTS: Record<Lang, Dict> = { en, fr, sw };

export const LANG_LABELS: Record<Lang, string> = {
  en: "English",
  fr: "Français",
  sw: "Kiswahili",
};

export const LANG_FLAGS: Record<Lang, string> = {
  en: "🇬🇧",
  fr: "🇫🇷",
  sw: "🇰🇪",
};

const STORAGE_KEY = "kifurushi.lang";

function detectLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "fr" || stored === "sw") return stored;
    const nav = navigator.language.toLowerCase();
    if (nav.startsWith("fr")) return "fr";
    if (nav.startsWith("sw")) return "sw";
  } catch {
    // SSR or blocked storage — fall through
  }
  return "en";
}

const LangContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
}>({ lang: "en", setLang: () => {} });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Render English on the server pass, then adopt the visitor's language
  // after mount (avoids hydration mismatches).
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    setLangState(detectLang());
  }, []);

  // Mirror the choice onto the member profile so server-sent emails
  // (delivery + payment confirmations) arrive in the same language.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user.id;
      if (uid) {
        supabase
          .from("profiles")
          .update({ lang })
          .eq("id", uid)
          .then(() => {});
      }
    });
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // private mode — the choice just won't persist
    }
  }, []);

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

/** The active language's dictionary — same shape in every language. */
export function useT(): Dict {
  return DICTS[useContext(LangContext).lang];
}
