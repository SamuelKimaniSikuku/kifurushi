export type ParcelCategory =
  | "documents"
  | "clothing"
  | "electronics"
  | "food"
  | "medicine"
  | "gifts"
  | "books"
  | "other";

export type MatchStatus =
  | "requested"
  | "accepted"
  | "escrow_paid"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "released";

export interface Trip {
  id: string;
  travelerName: string;
  travelerVerified: boolean;
  travelerRating: number; // 0–5
  tripsCompleted: number;
  fromCountry: string; // ISO code
  fromCity: string;
  toCountry: string;
  toCity: string;
  departDate: string; // ISO date
  spaceKg: number;
  pricePerKg: number; // USD
  notes: string;
  categoriesAccepted: ParcelCategory[];
  createdAt: string;
}

export interface ParcelRequest {
  id: string;
  senderName: string;
  senderVerified: boolean;
  fromCountry: string;
  fromCity: string;
  toCountry: string;
  toCity: string;
  neededBy: string; // ISO date
  weightKg: number;
  category: ParcelCategory;
  description: string;
  budgetUsd: number;
  createdAt: string;
}

export interface Match {
  id: string;
  tripId: string;
  parcelId: string;
  status: MatchStatus;
  updatedAt: string;
}

export interface TransitUpdate {
  id: string;
  matchId: string;
  note: string;
  createdAt: string;
}

export interface Review {
  id: string;
  matchId: string;
  authorName: string;
  rating: number; // 1–5
  comment: string;
  createdAt: string;
}

export const CATEGORY_LABELS: Record<ParcelCategory, string> = {
  documents: "📄 Documents",
  clothing: "👕 Clothing",
  electronics: "📱 Electronics",
  food: "🥫 Packaged food",
  medicine: "💊 Medicine (sealed)",
  gifts: "🎁 Gifts",
  books: "📚 Books",
  other: "📦 Other",
};

export const STATUS_LABELS: Record<MatchStatus, string> = {
  requested: "Requested",
  accepted: "Accepted",
  escrow_paid: "Terms agreed",
  picked_up: "Sealed & picked up",
  in_transit: "In transit",
  delivered: "Delivered",
  released: "Completed",
};

export const STATUS_ORDER: MatchStatus[] = [
  "requested",
  "accepted",
  "escrow_paid",
  "picked_up",
  "in_transit",
  "delivered",
  "released",
];
