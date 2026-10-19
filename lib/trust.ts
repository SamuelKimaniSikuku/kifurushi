"use client";
import { supabase } from "./supabase";
export type DeliveryReport = { id: string; status: "open" | "reviewing" | "resolved"; reason: string; resolution: string | null; created_at: string; photo_paths?: string[]; received_weight_kg?: number | null };
export type DeliveryReportState = { on_hold: boolean; my_verified?: boolean; partner_verified?: boolean; report: DeliveryReport | null };
export async function fetchDeliveryReport(match: string): Promise<DeliveryReportState> {
  const { data, error } = await supabase.rpc("my_delivery_report", { p_match: match });
  if (error) throw error;
  return data;
}
export async function reportDelivery(match: string, reason: string, details: string): Promise<string> {
  const { data, error } = await supabase.rpc("report_delivery", { p_match: match, p_reason: reason, p_details: details.trim() });
  if (error) throw error;
  return data;
}
export async function fetchPhoneVerification(): Promise<{ phone: string | null; verified: boolean }> {
  const { data, error } = await supabase.rpc("my_phone_verification");
  if (error) throw error;
  return data;
}
export function normalizePhone(value: string) { return value.replace(/[\s()-]/g, ""); }
export async function sendPhoneCode(phone: string) {
  const normalized = normalizePhone(phone);
  if (!/^\+[1-9][0-9]{6,14}$/.test(normalized)) throw new Error("Use a number with its country code, such as +254…");
  const { error } = await supabase.auth.updateUser({ phone: normalized });
  if (error) throw error;
}
export async function confirmPhoneCode(phone: string, token: string) {
  const { error } = await supabase.auth.verifyOtp({ phone: normalizePhone(phone), token, type: "phone_change" });
  if (error) throw error;
  const confirmed = await fetchPhoneVerification();
  if (!confirmed.verified || confirmed.phone !== normalizePhone(phone)) throw new Error("Phone verification could not be confirmed. Please try again.");
  return confirmed;
}

export type ReceiptOutcome = "received" | "missing_items" | "not_received";
export async function saveReceipt(match: string, outcome: ReceiptOutcome, details: string, photos: string[], weight: number | null) {
  const { error } = await supabase.rpc("record_delivery_feedback", { p_match: match, p_outcome: outcome, p_details: details.trim(), p_photos: photos, p_received_weight: weight });
  if (error) throw error;
}
export async function reportDeliveryDetails(match: string, reason: string, details: string, photos: string[], weight: number | null) {
  const { data, error } = await supabase.rpc("report_delivery_details", { p_match: match, p_reason: reason, p_details: details.trim(), p_photos: photos, p_received_weight: weight });
  if (error) throw error;
  return data as string;
}
