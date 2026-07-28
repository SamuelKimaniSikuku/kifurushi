// Person-page URLs are keyed by a slug of the display name — human-readable
// links (/people/amina-o) that TripCard/ParcelCard can emit without knowing
// user ids. lib/db.ts resolves a slug back to a profile via their open
// listings.

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
