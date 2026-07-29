"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Globe, Menu, Package, X } from "lucide-react";
import { useSession } from "@/lib/auth";
import { useLang, useT, LANG_LABELS, LANG_FLAGS, type Lang } from "@/lib/i18n";

function LanguageSwitcher({ compact }: { compact?: boolean }) {
  const { lang, setLang } = useLang();
  return (
    <label
      className={`inline-flex items-center gap-1.5 ${compact ? "w-full" : ""}`}
    >
      <Globe size={16} strokeWidth={2} className="shrink-0 text-muted" aria-hidden />
      <span className="sr-only">Language / Langue / Lugha</span>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
        className={`cursor-pointer rounded-lg border border-transparent bg-transparent py-1.5 pr-1 text-sm font-medium text-muted transition hover:text-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf ${
          compact ? "flex-1" : ""
        }`}
      >
        {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
          <option key={l} value={l}>
            {LANG_FLAGS[l]} {compact ? LANG_LABELS[l] : l.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function Nav() {
  const pathname = usePathname();
  const { session } = useSession();
  const [open, setOpen] = useState(false);
  const t = useT();

  const links = [
    { href: "/trips", label: t.nav.findTraveller },
    { href: "/parcels", label: t.nav.parcelRequests },
    { href: "/post/trip", label: t.nav.postTrip },
    { href: "/post/parcel", label: t.nav.sendParcel },
    { href: "/pricing", label: t.nav.pricing },
    { href: "/verify", label: t.nav.getVerified },
    { href: "/safety", label: t.nav.trustSafety },
  ];

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-xl font-display text-xl font-bold tracking-tight text-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2"
        >
          <span
            aria-hidden
            className="grid h-9 w-9 place-items-center rounded-xl bg-forest text-white"
          >
            <Package size={20} strokeWidth={2} />
          </span>
          <span>
            Kifurushi<span className="text-clay">.</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-5 xl:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={pathname === l.href ? "page" : undefined}
              className={`whitespace-nowrap rounded-md text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 ${
                pathname === l.href
                  ? "text-forest underline decoration-clay decoration-2 underline-offset-8"
                  : "text-muted hover:text-forest"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 xl:flex">
          <LanguageSwitcher />
          {session ? (
            <Link href="/dashboard" className="btn-primary whitespace-nowrap">
              {t.nav.dashboard}
            </Link>
          ) : (
            <Link href="/auth" className="btn-primary whitespace-nowrap">
              {t.nav.signIn}
            </Link>
          )}
        </div>

        <button
          type="button"
          className="grid h-11 w-11 place-items-center rounded-xl border border-line-strong bg-white text-forest transition-all hover:border-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 active:scale-[0.98] xl:hidden"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
        >
          {open ? (
            <X size={20} strokeWidth={2} aria-hidden />
          ) : (
            <Menu size={20} strokeWidth={2} aria-hidden />
          )}
        </button>
      </div>

      <nav
        id="mobile-nav"
        className={`overflow-hidden border-t bg-white transition-[max-height,opacity,visibility] duration-300 ease-out xl:hidden ${
          open
            ? "visible max-h-[480px] border-line opacity-100"
            : "invisible max-h-0 border-transparent opacity-0"
        }`}
      >
        <div className="px-4 py-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={pathname === l.href ? "page" : undefined}
              className={`block rounded-lg px-3 py-3 text-sm font-medium transition ${
                pathname === l.href
                  ? "bg-sand text-forest"
                  : "text-muted hover:bg-sand hover:text-forest"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <div className="my-3 border-t border-line" />
          <div className="px-3 py-1.5">
            <LanguageSwitcher compact />
          </div>
          <Link
            href={session ? "/dashboard" : "/auth"}
            className="btn-primary w-full"
          >
            {session ? t.nav.dashboard : t.nav.signIn}
          </Link>
        </div>
      </nav>
    </header>
  );
}
