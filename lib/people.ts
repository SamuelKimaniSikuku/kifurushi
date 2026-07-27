// Person profiles, assembled from the demo data layer.
//
// There are no accounts yet: Trip/ParcelRequest carry a display name and no
// owner id, and the rest of the app already treats the name as the identity
// (the dashboard matches a user's own parcels with `senderName === session.name`).
// So profiles are keyed off a slug of that name. A slug also keeps working for
// the seed data already sitting in visitors' localStorage, which adding a
// `travelerId` to the type would not.
//
// When Supabase auth lands, swap the slug for the auth user id — `personSlug`
// is the only place this assumption is encoded.

import { Match, ParcelRequest, Review, Trip } from "./types";

export function personSlug(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/\p{M}/gu, "") // fold accents so "José" and "Jose" resolve alike
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-") // keep non-Latin scripts intact
    .replace(/^-+|-+$/g, "");
  // A name of pure punctuation would slug away to nothing; keep it addressable.
  return slug || name.trim().toLowerCase();
}

export function personHref(name: string): string {
  return `/people/${encodeURIComponent(personSlug(name))}`;
}

export interface PersonProfile {
  slug: string;
  name: string;
  verified: boolean;
  /** Traveller rating — null for someone who has only ever sent parcels. */
  rating: number | null;
  deliveries: number;
  upcomingTrips: Trip[];
  openParcels: ParcelRequest[];
  /** Reviews written *about* this person by their counterparties. */
  reviews: Review[];
  /** ISO timestamp of their first posting. */
  joinedAt: string;
}

/**
 * Gather everything known about one person. Returns null when the slug matches
 * nobody, so the page can render a proper "not found" state.
 */
export function buildPersonProfile(
  slug: string,
  data: {
    trips: Trip[];
    parcels: ParcelRequest[];
    matches: Match[];
    reviews: Review[];
  }
): PersonProfile | null {
  const trips = data.trips.filter((t) => personSlug(t.travelerName) === slug);
  const parcels = data.parcels.filter((p) => personSlug(p.senderName) === slug);
  if (trips.length === 0 && parcels.length === 0) return null;

  const postings = [
    ...trips.map((t) => ({ name: t.travelerName, createdAt: t.createdAt })),
    ...parcels.map((p) => ({ name: p.senderName, createdAt: p.createdAt })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const newestTrip = [...trips].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  )[0];

  // Reviews live on a match; a match names the person through its trip or its
  // parcel. A review written *by* them is their opinion of someone else, so it
  // does not belong on their own profile.
  const tripIds = new Set(trips.map((t) => t.id));
  const parcelIds = new Set(parcels.map((p) => p.id));
  const theirMatchIds = new Set(
    data.matches
      .filter((m) => tripIds.has(m.tripId) || parcelIds.has(m.parcelId))
      .map((m) => m.id)
  );

  const today = new Date().toISOString().slice(0, 10);

  return {
    slug,
    // Newest posting wins the display name — the slug already established that
    // these records are the same person.
    name: postings[0].name,
    verified:
      trips.some((t) => t.travelerVerified) ||
      parcels.some((p) => p.senderVerified),
    rating: newestTrip ? newestTrip.travelerRating : null,
    deliveries: trips.reduce((most, t) => Math.max(most, t.tripsCompleted), 0),
    upcomingTrips: trips
      .filter((t) => t.departDate >= today)
      .sort((a, b) => a.departDate.localeCompare(b.departDate)),
    openParcels: parcels
      .filter((p) => p.neededBy >= today)
      .sort((a, b) => a.neededBy.localeCompare(b.neededBy)),
    reviews: data.reviews
      .filter(
        (r) => theirMatchIds.has(r.matchId) && personSlug(r.authorName) !== slug
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    joinedAt: postings[postings.length - 1].createdAt,
  };
}
