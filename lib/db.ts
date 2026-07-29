"use client";

// Supabase-backed data layer for the marketplace: trips, parcels, matches
// (via the server-side state-machine RPCs), transit updates, reviews and
// person profiles. RLS is the enforcement layer — these functions just
// shape the calls.

import { supabase } from "./supabase";
import {
  Trip, ParcelRequest, MatchStatus, ParcelCategory, TransitUpdate, Review,
  Message,
} from "./types";
import { personSlug } from "./people";

// ---------------------------------------------------------------------------
// Row mappers. Profile joins power the display fields (name, badge, rating).
// ---------------------------------------------------------------------------

interface ProfileRow {
  id: string;
  full_name: string;
  id_verified: boolean;
  rating: number;
  deliveries_completed: number;
}

interface TripRow {
  id: string;
  traveler_id: string;
  from_country: string;
  from_city: string;
  to_country: string;
  to_city: string;
  depart_date: string;
  space_kg: number;
  price_per_kg: number;
  notes: string | null;
  categories: string[] | null;
  created_at: string;
  profile: ProfileRow | null;
}

interface ParcelRow {
  id: string;
  sender_id: string;
  from_country: string;
  from_city: string;
  to_country: string;
  to_city: string;
  needed_by: string;
  weight_kg: number;
  categories: string[] | null;
  description: string;
  budget_usd: number;
  created_at: string;
  profile: ProfileRow | null;
}

const PROFILE_COLS = "id, full_name, id_verified, rating, deliveries_completed";

function mapTrip(row: TripRow): Trip {
  const p: ProfileRow | null = row.profile ?? null;
  return {
    id: row.id,
    travelerId: row.traveler_id,
    travelerName: p?.full_name ?? "Member",
    travelerVerified: p?.id_verified ?? false,
    travelerRating: Number(p?.rating ?? 5),
    tripsCompleted: p?.deliveries_completed ?? 0,
    fromCountry: row.from_country,
    fromCity: row.from_city,
    toCountry: row.to_country,
    toCity: row.to_city,
    departDate: row.depart_date,
    spaceKg: Number(row.space_kg),
    pricePerKg: Number(row.price_per_kg),
    notes: row.notes ?? "",
    categoriesAccepted: (row.categories ?? []) as ParcelCategory[],
    createdAt: row.created_at,
  };
}

function mapParcel(row: ParcelRow): ParcelRequest {
  const p: ProfileRow | null = row.profile ?? null;
  return {
    id: row.id,
    senderId: row.sender_id,
    senderName: p?.full_name ?? "Member",
    senderVerified: p?.id_verified ?? false,
    fromCountry: row.from_country,
    fromCity: row.from_city,
    toCountry: row.to_country,
    toCity: row.to_city,
    neededBy: row.needed_by,
    weightKg: Number(row.weight_kg),
    categories: (row.categories ?? []) as ParcelCategory[],
    description: row.description,
    budgetUsd: Number(row.budget_usd),
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Trips
// ---------------------------------------------------------------------------

const TRIP_SELECT = `*, profile:profiles!trips_traveler_id_fkey(${PROFILE_COLS})`;
const PARCEL_SELECT = `*, profile:profiles!parcels_sender_id_fkey(${PROFILE_COLS})`;

export async function fetchTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from("trips")
    .select(TRIP_SELECT)
    .eq("status", "open")
    .gte("depart_date", new Date().toISOString().slice(0, 10))
    .order("depart_date", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as unknown as TripRow[]).map(mapTrip);
}

export interface NewTrip {
  fromCountry: string;
  fromCity: string;
  toCountry: string;
  toCity: string;
  departDate: string;
  spaceKg: number;
  pricePerKg: number;
  notes: string;
  categoriesAccepted: ParcelCategory[];
}

export async function addTrip(t: NewTrip): Promise<void> {
  const { data: auth } = await supabase.auth.getSession();
  const uid = auth.session?.user.id;
  if (!uid) throw new Error("Not signed in");
  const { error } = await supabase.from("trips").insert({
    traveler_id: uid,
    from_country: t.fromCountry,
    from_city: t.fromCity,
    to_country: t.toCountry,
    to_city: t.toCity,
    depart_date: t.departDate,
    space_kg: t.spaceKg,
    price_per_kg: t.pricePerKg,
    notes: t.notes || null,
    categories: t.categoriesAccepted,
  });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Parcels
// ---------------------------------------------------------------------------

export async function fetchParcels(): Promise<ParcelRequest[]> {
  const { data, error } = await supabase
    .from("parcels")
    .select(PARCEL_SELECT)
    .eq("status", "open")
    .gte("needed_by", new Date().toISOString().slice(0, 10))
    .order("needed_by", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as unknown as ParcelRow[]).map(mapParcel);
}

export interface NewParcel {
  fromCountry: string;
  fromCity: string;
  toCountry: string;
  toCity: string;
  neededBy: string;
  weightKg: number;
  categories: ParcelCategory[];
  description: string;
  budgetUsd: number;
}

export async function addParcel(p: NewParcel): Promise<void> {
  const { data: auth } = await supabase.auth.getSession();
  const uid = auth.session?.user.id;
  if (!uid) throw new Error("Not signed in");
  const { error } = await supabase.from("parcels").insert({
    sender_id: uid,
    from_country: p.fromCountry,
    from_city: p.fromCity,
    to_country: p.toCountry,
    to_city: p.toCity,
    needed_by: p.neededBy,
    weight_kg: p.weightKg,
    categories: p.categories,
    description: p.description,
    budget_usd: p.budgetUsd,
  });
  if (error) throw error;
}

/** The caller's own open listings — needed before requesting/offering a match. */
export async function fetchMyOpenParcels(): Promise<{ id: string }[]> {
  const { data: auth } = await supabase.auth.getSession();
  const uid = auth.session?.user.id;
  if (!uid) return [];
  const { data, error } = await supabase
    .from("parcels")
    .select("id")
    .eq("sender_id", uid)
    .eq("status", "open")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchMyOpenTrips(): Promise<{ id: string }[]> {
  const { data: auth } = await supabase.auth.getSession();
  const uid = auth.session?.user.id;
  if (!uid) return [];
  const { data, error } = await supabase
    .from("trips")
    .select("id")
    .eq("traveler_id", uid)
    .eq("status", "open")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Matches — reads plus the five state-machine RPCs. Clients cannot UPDATE
// matches directly; the RPCs are the only doors.
// ---------------------------------------------------------------------------

export interface MatchDetail {
  id: string;
  tripId: string;
  parcelId: string;
  status: MatchStatus;
  updatedAt: string;
  /** The signed-in user's side of this match. */
  role: "traveler" | "sender";
  counterpartyId: string | null;
  counterpartyName: string;
  route: string; // e.g. "London → Lagos"
  hasCode: boolean;
}

export async function fetchMyMatches(): Promise<MatchDetail[]> {
  const { data: auth } = await supabase.auth.getSession();
  const uid = auth.session?.user.id;
  if (!uid) return [];

  const { data, error } = await supabase
    .from("matches")
    .select(
      `id, trip_id, parcel_id, status, updated_at, code_hash,
       trip:trips!matches_trip_id_fkey(from_city, to_city, traveler_id,
         profile:profiles!trips_traveler_id_fkey(id, full_name)),
       parcel:parcels!matches_parcel_id_fkey(sender_id,
         profile:profiles!parcels_sender_id_fkey(id, full_name))`
    )
    .order("updated_at", { ascending: false });
  if (error) throw error;

  interface MatchRow {
    id: string;
    trip_id: string;
    parcel_id: string;
    status: string;
    updated_at: string;
    code_hash: string | null;
    trip: {
      from_city: string;
      to_city: string;
      traveler_id: string;
      profile: { id: string; full_name: string } | null;
    } | null;
    parcel: {
      sender_id: string;
      profile: { id: string; full_name: string } | null;
    } | null;
  }

  const details = ((data ?? []) as unknown as MatchRow[]).map((row) => {
    const trip = row.trip ?? null;
    const parcel = row.parcel ?? null;
    const role: "traveler" | "sender" =
      trip?.traveler_id === uid ? "traveler" : "sender";
    const counterProfile = role === "traveler" ? parcel?.profile : trip?.profile;
    return {
      id: row.id,
      tripId: row.trip_id,
      parcelId: row.parcel_id,
      status: row.status as MatchStatus,
      updatedAt: row.updated_at,
      role,
      counterpartyId: counterProfile?.id ?? null,
      counterpartyName: counterProfile?.full_name ?? "your match partner",
      route: trip ? `${trip.from_city} → ${trip.to_city}` : "Delivery",
      hasCode: !!row.code_hash,
    };
  });

  // RLS hides a counterparty's listing once it closes (e.g. the parcel after
  // release), which would break reviews. The security-definer RPC still knows
  // who the other party is, and profiles are public — resolve the gaps.
  await Promise.all(
    details
      .filter((d) => !d.counterpartyId)
      .map(async (d) => {
        const { data: cid } = await supabase.rpc("match_counterparty", {
          p_match_id: d.id,
          p_uid: uid,
        });
        if (!cid) return;
        d.counterpartyId = cid as string;
        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", cid)
          .maybeSingle();
        if (prof?.full_name) d.counterpartyName = prof.full_name;
      })
  );

  return details;
}

/** Insert a match request. Returns "exists" when this pair is already matched. */
export async function requestMatch(
  tripId: string,
  parcelId: string
): Promise<"created" | "exists"> {
  const { data: auth } = await supabase.auth.getSession();
  const uid = auth.session?.user.id;
  if (!uid) throw new Error("Not signed in");
  const { error } = await supabase.from("matches").insert({
    trip_id: tripId,
    parcel_id: parcelId,
    requester_id: uid,
  });
  if (error) {
    if (error.code === "23505") return "exists"; // unique (trip_id, parcel_id)
    throw error;
  }
  return "created";
}

export async function respondMatch(matchId: string, accept: boolean): Promise<void> {
  const { error } = await supabase.rpc("respond_match", {
    p_match_id: matchId,
    p_accept: accept,
  });
  if (error) throw error;
}

export async function advanceMatch(matchId: string): Promise<void> {
  const { error } = await supabase.rpc("advance_match", { p_match_id: matchId });
  if (error) throw error;
}

export async function cancelMatch(matchId: string): Promise<void> {
  const { error } = await supabase.rpc("cancel_match", { p_match_id: matchId });
  if (error) throw error;
}

/** Sender only. Returns the plaintext code exactly once — relay it to the receiver. */
export async function generateDeliveryCode(matchId: string): Promise<string> {
  const { data, error } = await supabase.rpc("generate_delivery_code", {
    p_match_id: matchId,
  });
  if (error) throw error;
  return data as string;
}

/** Traveller only. False means wrong code (5 wrong tries locks for 15 min). */
export async function confirmDelivery(matchId: string, code: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("confirm_delivery", {
    p_match_id: matchId,
    p_code: code,
  });
  if (error) throw error;
  return data as boolean;
}

// ---------------------------------------------------------------------------
// Transit updates
// ---------------------------------------------------------------------------

export async function fetchTransitUpdates(matchId: string): Promise<TransitUpdate[]> {
  const { data, error } = await supabase
    .from("transit_updates")
    .select("id, match_id, note, created_at")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    matchId: r.match_id,
    note: r.note,
    createdAt: r.created_at,
  }));
}

export async function addTransitUpdate(matchId: string, note: string): Promise<void> {
  const { data: auth } = await supabase.auth.getSession();
  const uid = auth.session?.user.id;
  if (!uid) throw new Error("Not signed in");
  const { error } = await supabase.from("transit_updates").insert({
    match_id: matchId,
    author_id: uid,
    note,
  });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Messages — match-scoped chat. RLS: only the two parties can read, only
// active members can send, and the log is immutable.
// ---------------------------------------------------------------------------

export async function fetchMessages(matchId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select(
      "id, match_id, sender_id, body, created_at, sender:profiles!messages_sender_id_fkey(full_name)"
    )
    .eq("match_id", matchId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  interface MessageRow {
    id: string;
    match_id: string;
    sender_id: string;
    body: string;
    created_at: string;
    sender: { full_name: string } | null;
  }
  return ((data ?? []) as unknown as MessageRow[]).map((r) => ({
    id: r.id,
    matchId: r.match_id,
    senderId: r.sender_id,
    senderName: r.sender?.full_name ?? "Member",
    body: r.body,
    createdAt: r.created_at,
  }));
}

export async function sendMessage(matchId: string, body: string): Promise<void> {
  const { data: auth } = await supabase.auth.getSession();
  const uid = auth.session?.user.id;
  if (!uid) throw new Error("Not signed in");
  const { error } = await supabase.from("messages").insert({
    match_id: matchId,
    sender_id: uid,
    body,
  });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Reviews — two-way, immutable, only at status 'released' (RLS-enforced)
// ---------------------------------------------------------------------------

const REVIEW_SELECT =
  "id, match_id, author_id, rating, comment, created_at, author:profiles!reviews_author_id_fkey(full_name)";

interface ReviewRow {
  id: string;
  match_id: string;
  author_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  author: { full_name: string } | null;
}

function mapReview(r: ReviewRow): Review {
  return {
    id: r.id,
    matchId: r.match_id,
    authorId: r.author_id,
    authorName: r.author?.full_name ?? "Member",
    rating: r.rating,
    comment: r.comment ?? "",
    createdAt: r.created_at,
  };
}

export async function fetchMatchReviews(matchId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select(REVIEW_SELECT)
    .eq("match_id", matchId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as unknown as ReviewRow[]).map(mapReview);
}

export async function addReview(
  matchId: string,
  subjectId: string,
  rating: number,
  comment: string
): Promise<void> {
  const { data: auth } = await supabase.auth.getSession();
  const uid = auth.session?.user.id;
  if (!uid) throw new Error("Not signed in");
  const { error } = await supabase.from("reviews").insert({
    match_id: matchId,
    author_id: uid,
    subject_id: subjectId,
    rating,
    comment: comment || null,
  });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Person profiles — public data only (profiles, open listings, reviews),
// so signed-out visitors can browse them. Keyed by name slug, matching the
// links already emitted by TripCard/ParcelCard.
// ---------------------------------------------------------------------------

export interface PersonProfile {
  slug: string;
  name: string;
  verified: boolean;
  rating: number | null;
  deliveries: number;
  upcomingTrips: Trip[];
  openParcels: ParcelRequest[];
  reviews: Review[];
  joinedAt: string;
}

export async function fetchPersonProfile(slug: string): Promise<PersonProfile | null> {
  const [trips, parcels] = await Promise.all([fetchTrips(), fetchParcels()]);
  const theirTrips = trips.filter((t) => personSlug(t.travelerName) === slug);
  const theirParcels = parcels.filter((p) => personSlug(p.senderName) === slug);
  if (theirTrips.length === 0 && theirParcels.length === 0) return null;

  const profileId = theirTrips[0]?.travelerId ?? theirParcels[0]!.senderId;

  const [{ data: profile }, { data: reviewRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select(`${PROFILE_COLS}, created_at`)
      .eq("id", profileId)
      .maybeSingle(),
    supabase
      .from("reviews")
      .select(REVIEW_SELECT)
      .eq("subject_id", profileId)
      .order("created_at", { ascending: false }),
  ]);

  const newestTrip = theirTrips[0] ?? null;
  return {
    slug,
    name: profile?.full_name ?? newestTrip?.travelerName ?? theirParcels[0]!.senderName,
    verified: profile?.id_verified ?? false,
    rating: newestTrip ? Number(profile?.rating ?? 5) : null,
    deliveries: profile?.deliveries_completed ?? 0,
    upcomingTrips: theirTrips,
    openParcels: theirParcels,
    reviews: ((reviewRows ?? []) as unknown as ReviewRow[]).map(mapReview),
    joinedAt: profile?.created_at ?? new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Verification — Didit hosted KYC. submitVerification stores the phone,
// asks the didit-session edge function to open a hosted session, and returns
// the URL to redirect to. The didit-webhook function resolves the row and
// flips profiles.id_verified when Didit approves. Images never touch our
// storage — the whole capture happens on Didit's side.
// ---------------------------------------------------------------------------

export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export interface VerificationState {
  status: VerificationStatus;
  idType: string;
  submittedAt: string | null;
}

export async function fetchVerification(): Promise<VerificationState> {
  const { data: auth } = await supabase.auth.getSession();
  const uid = auth.session?.user.id;
  if (!uid) return { status: "unverified", idType: "", submittedAt: null };

  const { data, error } = await supabase
    .from("verifications")
    .select("id_type, status, created_at")
    .eq("user_id", uid)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { status: "unverified", idType: "", submittedAt: null };
  return {
    status: data.status as VerificationStatus,
    idType: data.id_type,
    submittedAt: data.created_at,
  };
}

/** Returns the Didit hosted-flow URL to redirect the user to. */
export async function submitVerification(
  phone: string,
  idType: string
): Promise<string> {
  const { data: auth } = await supabase.auth.getSession();
  const uid = auth.session?.user.id;
  if (!uid) throw new Error("Not signed in");

  const { error: cErr } = await supabase
    .from("private_contacts")
    .upsert({ user_id: uid, phone });
  if (cErr) throw cErr;

  const { data, error } = await supabase.functions.invoke("didit-session", {
    body: { id_type: idType },
  });
  if (error) throw error;
  const url = (data as { url?: string })?.url;
  if (!url) throw new Error("No verification URL returned");
  return url;
}
