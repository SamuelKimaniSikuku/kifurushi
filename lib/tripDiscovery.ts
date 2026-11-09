import type { RouteFilters } from "./routes";
import type { Trip } from "./types";

export function upcomingOnRoute(trips: Trip[], from = "", to = "", today = new Date().toISOString().slice(0, 10)) {
  return trips.filter((trip) => trip.departDate >= today && trip.remainingKg > 0 && (!from || trip.fromCountry === from) && (!to || trip.toCountry === to))
    .sort((a, b) => a.departDate.localeCompare(b.departDate) || a.id.localeCompare(b.id));
}

export function laterDepartures(trips: Trip[], from: string, to: string, date: string, today?: string) {
  return date ? upcomingOnRoute(trips, from, to, today).filter((trip) => trip.departDate > date) : [];
}

/** Calendar month boundaries are compared as ISO strings, without timezone shifts. */
export function filterUpcomingTrips(trips: Trip[], filters: RouteFilters, today?: string) {
  return upcomingOnRoute(trips, filters.from, filters.to, today)
    .filter((trip) => filters.month
      ? trip.departDate.slice(0, 7) === filters.month
      : !filters.date || trip.departDate <= filters.date)
    .sort((a, b) => filters.sort === "price"
      ? a.pricePerKg - b.pricePerKg || a.departDate.localeCompare(b.departDate) || a.id.localeCompare(b.id)
      : a.departDate.localeCompare(b.departDate) || a.id.localeCompare(b.id));
}
