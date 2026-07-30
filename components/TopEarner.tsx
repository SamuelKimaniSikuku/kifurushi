"use client";

// Social proof, but only once it's true. The database function behind this
// stays silent until the marketplace has real breadth — enough completed
// deliveries, spread across enough travellers who each carried for more than
// one sender. Until then this component renders nothing at all, because a
// headline figure produced by two friendly accounts is an advert, not proof.

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { fetchTopEarner, TopEarner as TopEarnerData } from "@/lib/db";
import { useT } from "@/lib/i18n";

export default function TopEarner() {
  const t = useT();
  const [top, setTop] = useState<TopEarnerData | null>(null);

  useEffect(() => {
    let live = true;
    fetchTopEarner()
      .then((d) => live && setTop(d))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  if (!top) return null;

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-2xl bg-white/5 px-5 py-4 text-center">
      <Trophy className="h-4 w-4 shrink-0 text-gold" strokeWidth={2} aria-hidden />
      <span className="text-sm text-white/80">
        {t.home.topEarner(top.earned, top.name, top.deliveries)}
      </span>
      <Link
        href={`/people/${top.slug}`}
        className="text-sm font-semibold text-gold underline underline-offset-2"
      >
        {t.home.topEarnerLink}
      </Link>
    </div>
  );
}
