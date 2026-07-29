export type ParcelCategory =
  | "documents"
  | "clothing"
  | "electronics"
  | "food"
  | "medicine"
  | "gifts"
  | "books"
  | "cosmetics"
  | "baby"
  | "shoes"
  | "other";

export type MatchStatus =
  | "requested"
  | "accepted"
  | "declined"
  | "escrow_paid"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "released"
  | "cancelled"
  | "disputed";

export interface Trip {
  id: string;
  travelerId: string;
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
  senderId: string;
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

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
}

export interface Review {
  id: string;
  matchId: string;
  authorId: string;
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
  cosmetics: "💄 Cosmetics & hair",
  baby: "🍼 Baby items",
  shoes: "👟 Shoes & bags",
  other: "📦 Other",
};

export const STATUS_LABELS: Record<MatchStatus, string> = {
  requested: "Requested",
  accepted: "Accepted",
  declined: "Declined",
  escrow_paid: "Terms agreed",
  picked_up: "Sealed & picked up",
  in_transit: "In transit",
  delivered: "Delivered",
  released: "Completed",
  cancelled: "Cancelled",
  disputed: "Disputed",
};

// The happy path shown on the progress bar. Terminal negatives
// (declined/cancelled/disputed) sit outside it.
export const STATUS_ORDER: MatchStatus[] = [
  "requested",
  "accepted",
  "escrow_paid",
  "picked_up",
  "in_transit",
  "delivered",
  "released",
];
