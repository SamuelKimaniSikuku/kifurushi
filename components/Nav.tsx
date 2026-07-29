"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Globe, Menu, Package, Plane, X } from "lucide-react";
import { useSession } from "@/lib/auth";
import { fetchAttention } from "@/lib/db";
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

interface RoleItem {
  href: string;
  label: string;
  desc: string;
}

/** Desktop dropdown grouping the two things one role can do. */
function RoleMenu({
  label,
  Icon,
  items,
  pathname,
}: {
  label: string;
  Icon: typeof Plane;
  items: RoleItem[];
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = items.some((i) => i.href === pathname);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-1 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 ${
          active || open ? "text-forest" : "text-ink hover:text-forest"
        }`}
      >
        <Icon size={16} strokeWidth={2} className="shrink-0 text-clay" aria-hidden />
        {label}
        <ChevronDown
          size={14}
          strokeWidth={2.5}
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-[19rem] rounded-2xl border border-line bg-white p-2 shadow-xl">
          {items.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              onClick={() => setOpen(false)}
              className={`block rounded-xl px-3 py-2.5 transition hover:bg-sand ${
                pathname === i.href ? "bg-sand" : ""
              }`}
            >
              <div className="text-sm font-semibold text-ink">{i.label}</div>
              <div className="mt-0.5 text-xs leading-snug text-muted">{i.desc}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Nav() {
  const pathname = usePathname();
  const { session } = useSession();
  const [open, setOpen] = useState(false);
  const [waiting, setWaiting] = useState(0);
  const t = useT();

  // Badge on the dashboard button: how many matches need this member's
  // action right now. Refreshed on navigation and every minute.
  useEffect(() => {
    if (!session) {
      setWaiting(0);
      return;
    }
    let live = true;
    const load = () =>
      fetchAttention()
        .then((a) => {
          if (live) setWaiting(a.total);
        })
        .catch(() => {});
    load();
    const timer = setInterval(load, 60000);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [session, pathname]);

  // Two roles, each with "post mine" and "browse theirs".
  const travelling: RoleItem[] = [
    { href: "/post/trip", label: t.roles.postTrip, desc: t.roles.postTripDesc },
    {
      href: "/parcels",
      label: t.roles.browseParcels,
      desc: t.roles.browseParcelsDesc,
    },
  ];
  const sending: RoleItem[] = [
    {
      href: "/post/parcel",
      label: t.roles.postParcel,
      desc: t.roles.postParcelDesc,
    },
    {
      href: "/trips",
      label: t.roles.findTraveller,
      desc: t.roles.findTravellerDesc,
    },
  ];
  const plainLinks = [
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

        <nav className="hidden items-center gap-5 lg:flex">
          <RoleMenu
            label={t.roles.travelling}
            Icon={Plane}
            items={travelling}
            pathname={pathname}
          />
          <RoleMenu
            label={t.roles.sending}
            Icon={Package}
            items={sending}
            pathname={pathname}
          />
          <span aria-hidden className="h-5 w-px bg-line" />
          {plainLinks.map((l) => (
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

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <LanguageSwitcher />
          {session ? (
            <Link href="/dashboard" className="btn-primary relative whitespace-nowrap">
              {t.nav.dashboard}
              {waiting > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-[20px] place-items-center rounded-full bg-clay px-1 text-[11px] font-bold text-white ring-2 ring-white">
                  {waiting > 9 ? "9+" : waiting}
                  <span className="sr-only"> {t.nav.needsAttention(waiting)}</span>
                </span>
              )}
            </Link>
          ) : (
            <Link href="/auth" className="btn-primary whitespace-nowrap">
              {t.nav.signIn}
            </Link>
          )}
        </div>

        <button
          type="button"
          className="grid h-11 w-11 place-items-center rounded-xl border border-line-strong bg-white text-forest transition-all hover:border-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 active:scale-[0.98] lg:hidden"
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
        className={`overflow-hidden border-t bg-white transition-[max-height,opacity,visibility] duration-300 ease-out lg:hidden ${
          open
            ? "visible max-h-[640px] border-line opacity-100"
            : "invisible max-h-0 border-transparent opacity-0"
        }`}
      >
        <div className="px-4 py-3">
          {[
            { label: t.roles.travelling, Icon: Plane, items: travelling },
            { label: t.roles.sending, Icon: Package, items: sending },
          ].map((group) => (
            <div key={group.label} className="mb-3">
              <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-forest">
                <group.Icon size={14} strokeWidth={2} className="text-clay" aria-hidden />
                {group.label}
              </div>
              {group.items.map((i) => (
                <Link
                  key={i.href}
                  href={i.href}
                  aria-current={pathname === i.href ? "page" : undefined}
                  className={`block rounded-lg px-3 py-2.5 transition ${
                    pathname === i.href
                      ? "bg-sand text-forest"
                      : "text-ink hover:bg-sand"
                  }`}
                >
                  <div className="text-sm font-semibold">{i.label}</div>
                  <div className="mt-0.5 text-xs text-muted">{i.desc}</div>
                </Link>
              ))}
            </div>
          ))}

          <div className="my-2 border-t border-line" />
          {plainLinks.map((l) => (
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
            {session && waiting > 0 && (
              <span className="ml-1.5 grid h-5 min-w-[20px] place-items-center rounded-full bg-clay px-1 text-[11px] font-bold text-white">
                {waiting > 9 ? "9+" : waiting}
                <span className="sr-only"> {t.nav.needsAttention(waiting)}</span>
              </span>
            )}
          </Link>
        </div>
      </nav>
    </header>
  );
}
