"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Package, X } from "lucide-react";
import { useSession } from "@/lib/auth";

const links = [
  { href: "/trips", label: "Find a traveller" },
  { href: "/parcels", label: "Parcel requests" },
  { href: "/post/trip", label: "Post a trip" },
  { href: "/post/parcel", label: "Send a parcel" },
  { href: "/pricing", label: "Pricing" },
  { href: "/verify", label: "Get verified" },
  { href: "/safety", label: "Trust & safety" },
];

export default function Nav() {
  const pathname = usePathname();
  const { session } = useSession();
  const [open, setOpen] = useState(false);

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
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
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

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={pathname === l.href ? "page" : undefined}
              className={`rounded-md text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 ${
                pathname === l.href
                  ? "text-forest underline decoration-clay decoration-2 underline-offset-8"
                  : "text-muted hover:text-forest"
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
          type="button"
          className="grid h-11 w-11 place-items-center rounded-xl border border-line-strong bg-white text-forest transition-all hover:border-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 active:scale-[0.98] md:hidden"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
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
        className={`overflow-hidden border-t bg-white transition-[max-height,opacity,visibility] duration-300 ease-out md:hidden ${
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
          <Link
            href={session ? "/dashboard" : "/auth"}
            className="btn-primary w-full"
          >
            {session ? "Dashboard" : "Sign in"}
          </Link>
        </div>
      </nav>
    </header>
  );
}
