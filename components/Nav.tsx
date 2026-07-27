"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getSession, Session } from "@/lib/store";

const links = [
  { href: "/trips", label: "Find a traveller" },
  { href: "/parcels", label: "Parcel requests" },
  { href: "/post/trip", label: "Post a trip" },
  { href: "/post/parcel", label: "Send a parcel" },
  { href: "/pricing", label: "Pricing" },
  { href: "/safety", label: "Trust & safety" },
];

export default function Nav() {
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setSession(getSession());
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-[#e5ddcd] bg-[var(--sand)]/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="display flex items-center gap-2 text-xl font-extrabold text-[var(--forest)]">
          <span aria-hidden className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--forest)] text-lg text-white">📦</span>
          Kifurushi<span className="text-[var(--clay)]">.</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition ${
                pathname === l.href
                  ? "text-[var(--forest)] underline decoration-[var(--clay)] decoration-2 underline-offset-8"
                  : "text-[#5c6b63] hover:text-[var(--forest)]"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {session ? (
            <Link href="/dashboard" className="btn-primary">
              {session.name.split(" ")[0]}&apos;s dashboard
            </Link>
          ) : (
            <Link href="/auth" className="btn-primary">Sign in</Link>
          )}
        </div>

        <button
          className="rounded-lg border border-[#d8cfbc] p-2 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          ☰
        </button>
      </div>

      {open && (
        <nav className="border-t border-[#e5ddcd] bg-[var(--sand)] px-4 py-3 md:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="block py-2 text-sm font-medium text-[#3d4a43]">
              {l.label}
            </Link>
          ))}
          <Link href={session ? "/dashboard" : "/auth"} className="block py-2 text-sm font-semibold text-[var(--forest)]">
            {session ? "Dashboard" : "Sign in"}
          </Link>
        </nav>
      )}
    </header>
  );
}
