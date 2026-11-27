import type { Trip, ParcelRequest } from './types';
import { acceptsContents } from './parcelContents';
import type { MatchDetail } from './db';
export const listingHref = (kind: 'trip'|'parcel', id: string) => `/dashboard/listings?kind=${kind}&id=${encodeURIComponent(id)}`;
export const conversationHref = (id: string) => `/dashboard#messages-${encodeURIComponent(id)}`;
export function fittingTrips(parcel: ParcelRequest, trips: Trip[], today: string, later = false): Trip[] {
 return trips.filter(t => t.travelerId !== parcel.senderId && t.fromCountry === parcel.fromCountry && t.toCountry === parcel.toCountry && t.departDate >= today && (later ? t.departDate > parcel.neededBy : t.departDate <= parcel.neededBy) && t.remainingKg > 0 && (parcel.weightKg == null || t.remainingKg >= parcel.weightKg) && acceptsContents(t.categoriesAccepted, parcel.categories))
 .sort((a,b) => Number(b.travelerVerified)-Number(a.travelerVerified) || a.departDate.localeCompare(b.departDate) || a.pricePerKg-b.pricePerKg);
}
export function fittingParcels(trip: Trip, parcels: ParcelRequest[], today: string): ParcelRequest[] {
 return parcels.filter(p => p.senderId !== trip.travelerId && trip.departDate >= today && p.fromCountry === trip.fromCountry && p.toCountry === trip.toCountry && p.neededBy >= trip.departDate && trip.remainingKg > 0 && (p.weightKg == null || p.weightKg <= trip.remainingKg) && acceptsContents(trip.categoriesAccepted, p.categories)).sort((a,b)=>a.neededBy.localeCompare(b.neededBy));
}
export function nextSteps(matches: MatchDetail[], uid: string) {
 return matches.flatMap(m => {
  if (m.receiptOutcome) return [];
  let label = '';
  if (m.status === 'requested' && m.requesterId !== uid && m.requestAvailability === 'available') label = 'Reply to this request';
  if (m.status === 'accepted') label = 'Agree the fee and handover';
  if (m.status === 'delivered' && m.role === 'sender') label = 'Confirm receipt or report a problem';
  return label ? [{...m,label,href:conversationHref(m.id)}] : [];
 }).sort((a,b)=>a.updatedAt.localeCompare(b.updatedAt));
}
export function tripPromotion(t: Trip): string {
 return `📦 Sending something from ${t.fromCity} to ${t.toCity}?\n\nA traveller leaves on ${new Date(t.departDate+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}.\n${t.remainingKg} kg available · listed price $${t.pricePerKg}/kg.\n${t.travelerVerified ? 'Identity verified on Kifurushi.' : 'Identity verification is pending.'}\n\nCheck the trip, message the traveller and agree the final fee and handover:\nhttps://www.kifurushiapp.com/trips?open=${t.id}\n\nAvailability can change. Confirm that your items can be carried before booking.`;
}
