import type { MatchStatus } from './types';
export interface DeliveryOffer {
 id: string; match_id: string; proposer_id: string; amount: number; currency: string;
 weight_kg: number | null; handover: string; status: 'pending' | 'accepted' | 'declined' | 'superseded';
 created_at: string; responded_at: string | null; responder_id: string | null;
}
export function deliveryMilestone(status: MatchStatus): number {
 if (status === 'released') return 3;
 if (['picked_up','in_transit','delivered'].includes(status)) return 2;
 if (status === 'escrow_paid') return 1;
 return 0;
}
