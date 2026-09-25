"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { fetchTrips } from "@/lib/db";
import type { Trip } from "@/lib/types";
import { useLang } from "@/lib/i18n";
import { safetyCopy } from "@/lib/locales/safety";
import { upcomingOnRoute } from "@/lib/tripDiscovery";
import TripCard from "./TripCard";
import SkeletonCard from "./ui/SkeletonCard";
import ListingError from "./ListingError";

export default function UpcomingTravellers() {
  const { lang } = useLang(); const s = safetyCopy[lang];
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true; setLoaded(false); setError(false);
    fetchTrips().then((items) => { if (live) setTrips(upcomingOnRoute(items).slice(0, 6)); })
      .catch(() => { if (live) setError(true); }).finally(() => { if (live) setLoaded(true); });
    return () => { live = false; };
  }, [attempt]);
  return <section className="mx-auto max-w-6xl px-4 pt-12 md:pt-16" aria-labelledby="upcoming-travellers">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 id="upcoming-travellers" className="text-3xl font-bold text-forest">{s.upcoming}</h2><p className="mt-3 text-base text-muted">{s.upcomingNote}</p></div><Link href="/trips" className="btn-primary">{s.viewAll}<ArrowRight size={18} aria-hidden /></Link></div>
    {!loaded ? <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">{[0,1,2].map((i) => <SkeletonCard key={i} />)}</div>
      : error ? <ListingError retry={() => setAttempt((n) => n + 1)} />
      : trips.length ? <div className="mt-6 grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-3">{trips.map((trip) => <TripCard key={trip.id} trip={trip} detailsHref={`/trips?open=${trip.id}`} />)}</div>
      : <div className="mt-6 rounded-2xl border border-line bg-white p-6"><p className="text-muted">{s.noUpcoming}</p><Link href="/post/parcel" className="btn-ghost mt-3">{lang === "fr" ? "Publier mon colis" : lang === "sw" ? "Chapisha kifurushi changu" : "Post my parcel"}</Link></div>}
  </section>;
}
