"use client";

import { supabase } from "./supabase";
import { declarationSchema, validateEvidenceFile, type DeclarationDraft, type ParcelDeclaration, type Inspection, type RefusalReason, type SafetyRefusal } from "./parcelSafety";

export async function uploadEvidence(file: File): Promise<string> {
  if (!validateEvidenceFile(file)) throw new Error("Use a JPG, PNG or WebP photo under 8 MB.");
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error("Sign in to add photos.");
  const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
  const path = `${data.session.user.id}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("parcel-evidence").upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  return path;
}

// Download through the authenticated Storage API; object URLs never expose a
// public bucket or long-lived signed URL and work with the existing CSP.
export async function evidencePreview(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from("parcel-evidence").download(path);
  if (error) throw error;
  return URL.createObjectURL(data);
}

export async function fetchDeclaration(parcelId: string): Promise<ParcelDeclaration | null> {
  const { data, error } = await supabase.from("parcel_declarations").select("*").eq("parcel_id", parcelId).order("version", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data as ParcelDeclaration | null;
}

export async function saveDeclaration(parcelId: string, draft: DeclarationDraft): Promise<void> {
  const declaration = declarationSchema.parse(draft);
  const { error } = await supabase.rpc("declare_parcel", { p_parcel_id: parcelId, p_items: declaration.items, p_photo_paths: declaration.photoPaths, p_attested: declaration.attested });
  if (error) throw error;
}

export async function fetchMatchSafety(matchId: string, parcelId: string) {
  const [declaration, inspections, refusal] = await Promise.all([
    fetchDeclaration(parcelId),
    supabase.from("match_inspections").select("*").eq("match_id", matchId),
    supabase.from("match_safety_refusals").select("*").eq("match_id", matchId).maybeSingle(),
  ]);
  if (inspections.error) throw inspections.error;
  if (refusal.error) throw refusal.error;
  return { declaration, inspections: (inspections.data ?? []) as Inspection[], refusal: refusal.data as SafetyRefusal | null };
}

export async function confirmInspection(matchId: string, version: number, photos: string[], checks: { opened: boolean; matches: boolean; sealed: boolean; noConcerns: boolean }) {
  const { error } = await supabase.rpc("confirm_parcel_inspection", {
    p_match_id: matchId, p_version: version, p_photo_paths: photos,
    p_opened: checks.opened, p_matches: checks.matches, p_sealed: checks.sealed, p_no_concerns: checks.noConcerns,
  });
  if (error) throw error;
}

export async function refuseParcel(matchId: string, reason: RefusalReason, notes: string) {
  const { error } = await supabase.rpc("refuse_parcel", { p_match_id: matchId, p_reason: reason, p_notes: notes });
  if (error) throw error;
}
