"use client";

// Demo data layer. All data lives in localStorage so the app runs with no
// backend. Swap these functions for Supabase queries (see supabase/schema.sql)
// when going to production — the shapes match the SQL schema 1:1.

import {
  Trip, ParcelRequest, Match, MatchStatus, STATUS_ORDER, TransitUpdate, Review,
} from "./types";

const KEYS = {
  trips: "kifurushi.trips",
  parcels: "kifurushi.parcels",
  matches: "kifurushi.matches",
  updates: "kifurushi.updates",
  reviews: "kifurushi.reviews",
  session: "kifurushi.session",
  verification: "kifurushi.verification",
  membership: "kifurushi.membership",
  seeded: "kifurushi.seeded.v1",
};

export interface Session {
  name: string;
  email: string;
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function uid(): string {
  return crypto.randomUUID();
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function seedIfNeeded() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(KEYS.seeded)) return;

  const now = new Date().toISOString();
  const trips: Trip[] = [
    {
      id: uid(), travelerName: "Amina O.", travelerVerified: true, travelerRating: 4.9,
      tripsCompleted: 23, fromCountry: "GB", fromCity: "London", toCountry: "NG",
      toCity: "Lagos", departDate: daysFromNow(6), spaceKg: 18, pricePerKg: 9,
      notes: "Direct BA flight. Can meet at Stratford or post within London.",
      categoriesAccepted: ["documents", "clothing", "gifts", "books"], createdAt: now,
    },
    {
      id: uid(), travelerName: "Jean-Paul K.", travelerVerified: true, travelerRating: 4.7,
      tripsCompleted: 11, fromCountry: "FR", fromCity: "Paris", toCountry: "SN",
      toCity: "Dakar", departDate: daysFromNow(4), spaceKg: 12, pricePerKg: 8,
      notes: "Air France direct. Pickup near Gare du Nord.",
      categoriesAccepted: ["documents", "clothing", "gifts", "food"], createdAt: now,
    },
    {
      id: uid(), travelerName: "Grace W.", travelerVerified: true, travelerRating: 5.0,
      tripsCompleted: 31, fromCountry: "US", fromCity: "Atlanta", toCountry: "KE",
      toCity: "Nairobi", departDate: daysFromNow(9), spaceKg: 20, pricePerKg: 11,
      notes: "Qatar via Doha. Drop-off in Midtown ATL before Thursday.",
      categoriesAccepted: ["documents", "electronics", "clothing", "gifts", "books"], createdAt: now,
    },
    {
      id: uid(), travelerName: "Mohamed A.", travelerVerified: false, travelerRating: 4.5,
      tripsCompleted: 6, fromCountry: "AE", fromCity: "Dubai", toCountry: "EG",
      toCity: "Cairo", departDate: daysFromNow(3), spaceKg: 10, pricePerKg: 7,
      notes: "Frequent route, twice monthly.",
      categoriesAccepted: ["documents", "electronics", "gifts"], createdAt: now,
    },
    {
      id: uid(), travelerName: "Thandiwe M.", travelerVerified: true, travelerRating: 4.8,
      tripsCompleted: 17, fromCountry: "ZA", fromCity: "Johannesburg", toCountry: "GB",
      toCity: "Manchester", departDate: daysFromNow(12), spaceKg: 15, pricePerKg: 10,
      notes: "Happy to carry biltong & rooibos for homesick Saffas!",
      categoriesAccepted: ["food", "clothing", "gifts", "books", "documents"], createdAt: now,
    },
    {
      id: uid(), travelerName: "Kwame B.", travelerVerified: true, travelerRating: 4.6,
      tripsCompleted: 9, fromCountry: "DE", fromCity: "Frankfurt", toCountry: "GH",
      toCity: "Accra", departDate: daysFromNow(7), spaceKg: 14, pricePerKg: 9,
      notes: "Lufthansa direct. Can receive parcels by DHL beforehand.",
      categoriesAccepted: ["documents", "clothing", "electronics", "gifts"], createdAt: now,
    },
    {
      id: uid(), travelerName: "Fatima Z.", travelerVerified: true, travelerRating: 4.9,
      tripsCompleted: 27, fromCountry: "CA", fromCity: "Toronto", toCountry: "ET",
      toCity: "Addis Ababa", departDate: daysFromNow(10), spaceKg: 16, pricePerKg: 12,
      notes: "Ethiopian Airlines direct. Meet at Union Station.",
      categoriesAccepted: ["documents", "medicine", "clothing", "gifts"], createdAt: now,
    },
    {
      id: uid(), travelerName: "David M.", travelerVerified: false, travelerRating: 4.3,
      tripsCompleted: 4, fromCountry: "KE", fromCity: "Nairobi", toCountry: "US",
      toCity: "Dallas", departDate: daysFromNow(8), spaceKg: 8, pricePerKg: 13,
      notes: "Carrying crafts & coffee for diaspora. Space for small items.",
      categoriesAccepted: ["documents", "gifts", "food", "books"], createdAt: now,
    },
  ];

  const parcels: ParcelRequest[] = [
    {
      id: uid(), senderName: "Chidi E.", senderVerified: true, fromCountry: "GB",
      fromCity: "Birmingham", toCountry: "NG", toCity: "Enugu", neededBy: daysFromNow(14),
      weightKg: 3, category: "documents", budgetUsd: 45,
      description: "University transcripts and a sealed envelope of family photos.",
      createdAt: now,
    },
    {
      id: uid(), senderName: "Mariam D.", senderVerified: true, fromCountry: "FR",
      fromCity: "Lyon", toCountry: "ML", toCity: "Bamako", neededBy: daysFromNow(10),
      weightKg: 6, category: "clothing", budgetUsd: 60,
      description: "Children's clothes and shoes for my nieces. Two vacuum bags.",
      createdAt: now,
    },
    {
      id: uid(), senderName: "Samuel N.", senderVerified: false, fromCountry: "KE",
      fromCity: "Mombasa", toCountry: "GB", toCity: "London", neededBy: daysFromNow(20),
      weightKg: 2, category: "food", budgetUsd: 35,
      description: "Sealed packets of Kenyan tea and spices for my brother.",
      createdAt: now,
    },
    {
      id: uid(), senderName: "Aisha T.", senderVerified: true, fromCountry: "US",
      fromCity: "Houston", toCountry: "TZ", toCity: "Dar es Salaam", neededBy: daysFromNow(16),
      weightKg: 4, category: "electronics", budgetUsd: 90,
      description: "A sealed-box tablet and phone accessories for my mother.",
      createdAt: now,
    },
    {
      id: uid(), senderName: "Yosef G.", senderVerified: true, fromCountry: "ET",
      fromCity: "Addis Ababa", toCountry: "CA", toCity: "Toronto", neededBy: daysFromNow(18),
      weightKg: 5, category: "gifts", budgetUsd: 70,
      description: "Wedding gifts: traditional habesha kemis (2) and coffee set.",
      createdAt: now,
    },
    {
      id: uid(), senderName: "Ngozi A.", senderVerified: true, fromCountry: "NG",
      fromCity: "Lagos", toCountry: "US", toCity: "Chicago", neededBy: daysFromNow(12),
      weightKg: 7, category: "food", budgetUsd: 85,
      description: "Sealed egusi, ogbono, crayfish and dried fish, all customs-safe packed.",
      createdAt: now,
    },
  ];

  write(KEYS.trips, trips);
  write(KEYS.parcels, parcels);
  write(KEYS.matches, []);
  localStorage.setItem(KEYS.seeded, "1");
}

// ---- Trips ----
export function getTrips(): Trip[] {
  seedIfNeeded();
  return read<Trip[]>(KEYS.trips, []).sort((a, b) =>
    a.departDate.localeCompare(b.departDate)
  );
}

export function addTrip(t: Omit<Trip, "id" | "createdAt">): Trip {
  const trip: Trip = { ...t, id: uid(), createdAt: new Date().toISOString() };
  const all = getTrips();
  write(KEYS.trips, [trip, ...all]);
  return trip;
}

// ---- Parcels ----
export function getParcels(): ParcelRequest[] {
  seedIfNeeded();
  return read<ParcelRequest[]>(KEYS.parcels, []).sort((a, b) =>
    a.neededBy.localeCompare(b.neededBy)
  );
}

export function addParcel(p: Omit<ParcelRequest, "id" | "createdAt">): ParcelRequest {
  const parcel: ParcelRequest = { ...p, id: uid(), createdAt: new Date().toISOString() };
  const all = getParcels();
  write(KEYS.parcels, [parcel, ...all]);
  return parcel;
}

// ---- Matches ----
export function getMatches(): Match[] {
  return read<Match[]>(KEYS.matches, []);
}

export function requestMatch(tripId: string, parcelId: string): Match {
  const existing = getMatches().find(
    (m) => m.tripId === tripId && m.parcelId === parcelId
  );
  if (existing) return existing;
  const match: Match = {
    id: uid(),
    tripId,
    parcelId,
    status: "requested",
    updatedAt: new Date().toISOString(),
  };
  write(KEYS.matches, [match, ...getMatches()]);
  return match;
}

export function advanceMatch(id: string): Match | undefined {
  const all = getMatches();
  const m = all.find((x) => x.id === id);
  if (!m) return;
  const idx = STATUS_ORDER.indexOf(m.status);
  if (idx < STATUS_ORDER.length - 1) {
    m.status = STATUS_ORDER[idx + 1] as MatchStatus;
    m.updatedAt = new Date().toISOString();
    write(KEYS.matches, all);
  }
  return m;
}

// ---- Transit updates ----
export function getTransitUpdates(matchId: string): TransitUpdate[] {
  return read<TransitUpdate[]>(KEYS.updates, [])
    .filter((u) => u.matchId === matchId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function addTransitUpdate(matchId: string, note: string): TransitUpdate {
  const update: TransitUpdate = {
    id: uid(),
    matchId,
    note,
    createdAt: new Date().toISOString(),
  };
  write(KEYS.updates, [...read<TransitUpdate[]>(KEYS.updates, []), update]);
  return update;
}

// ---- Reviews ----
export function getReview(matchId: string): Review | undefined {
  return read<Review[]>(KEYS.reviews, []).find((r) => r.matchId === matchId);
}

export function addReview(
  matchId: string,
  authorName: string,
  rating: number,
  comment: string
): Review {
  const existing = getReview(matchId);
  if (existing) return existing; // one review per delivery, immutable
  const review: Review = {
    id: uid(),
    matchId,
    authorName,
    rating,
    comment,
    createdAt: new Date().toISOString(),
  };
  write(KEYS.reviews, [...read<Review[]>(KEYS.reviews, []), review]);
  return review;
}

// ---- Verification ----
// Demo simulation of KYC. IMPORTANT: we deliberately never persist the ID or
// selfie images — only the outcome. In production the images go directly to
// the KYC provider (Smile ID / Stripe Identity) over HTTPS and never touch
// our own storage; we keep only provider reference + boolean result.
export type VerificationStatus = "unverified" | "pending" | "verified";

export interface Verification {
  status: VerificationStatus;
  phone: string;
  idType: string;
  submittedAt: string | null;
}

export function getVerification(): Verification {
  return read<Verification>(KEYS.verification, {
    status: "unverified",
    phone: "",
    idType: "",
    submittedAt: null,
  });
}

export function submitVerification(phone: string, idType: string): Verification {
  const v: Verification = {
    status: "pending",
    phone,
    idType,
    submittedAt: new Date().toISOString(),
  };
  write(KEYS.verification, v);
  return v;
}

// Demo stand-in for the KYC provider's webhook approving the check.
export function approveVerification(): Verification {
  const v = { ...getVerification(), status: "verified" as const };
  write(KEYS.verification, v);
  return v;
}

export function isVerified(): boolean {
  return getVerification().status === "verified";
}

// ---- Membership (one price, every role) ----
// One $29/year membership covers sending, receiving and travelling.
// Demo: joining is instant. Production: Stripe Billing / Paystack / Flutterwave
// subscription, with the webhook (service role) flipping the status.
export interface Membership {
  status: "free" | "member";
  since: string | null;
}

export function getMembership(): Membership {
  return read<Membership>(KEYS.membership, { status: "free", since: null });
}

export function joinMembership(): Membership {
  const m: Membership = { status: "member", since: new Date().toISOString() };
  write(KEYS.membership, m);
  return m;
}

export function isMember(): boolean {
  return getMembership().status === "member";
}

// ---- Session (demo auth) ----
export function getSession(): Session | null {
  return read<Session | null>(KEYS.session, null);
}

export function signIn(name: string, email: string): Session {
  const s = { name, email };
  write(KEYS.session, s);
  return s;
}

export function signOut() {
  localStorage.removeItem(KEYS.session);
}
