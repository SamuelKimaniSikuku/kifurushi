import { z } from "zod";

export const declarationItemSchema = z.object({
  description: z.string().trim().min(3, "Describe each item (at least 3 characters)").max(160),
  quantity: z.coerce.number().int().min(1).max(1000),
  valueUsd: z.coerce.number().finite().min(0.01, "Enter the value of these items").max(100000),
});

export const declarationSchema = z.object({
  items: z.array(declarationItemSchema).min(1).max(30),
  photoPaths: z.array(z.string().min(1).max(300)).min(1, "Add a photo of the contents").max(6),
  attested: z.literal(true, { message: "Confirm your contents declaration" }),
}).refine((d) => d.items.reduce((total, item) => total + item.valueUsd, 0) <= 100000, {
  message: "Total declared value must not exceed $100,000", path: ["items"],
});

export type DeclarationItem = z.infer<typeof declarationItemSchema>;
export interface DeclarationDraft {
  items: { description: string; quantity: string; valueUsd: string }[];
  photoPaths: string[];
  attested: boolean;
}
export function emptyDeclaration(): DeclarationDraft {
  return { items: [{ description: "", quantity: "1", valueUsd: "" }], photoPaths: [], attested: false };
}
export interface ParcelDeclaration {
  parcel_id: string;
  version: number;
  items: DeclarationItem[];
  photo_paths: string[];
  declared_value_usd: number;
  declared_at: string;
}
export interface Inspection {
  match_id: string;
  user_id: string;
  declaration_version: number;
  role: "sender" | "traveler";
  photo_paths: string[];
  confirmed_at: string;
}
export const REFUSAL_REASONS = ["contents_mismatch", "cannot_inspect", "prohibited_or_restricted", "other_safety_concern"] as const;
export type RefusalReason = typeof REFUSAL_REASONS[number];
export interface SafetyRefusal {
  match_id: string;
  reason: RefusalReason;
  notes: string;
  created_at: string;
}

export function validateEvidenceFile(file: Pick<File, "type" | "size">): boolean {
  return ["image/jpeg", "image/png", "image/webp"].includes(file.type) && file.size > 0 && file.size <= 8 * 1024 * 1024;
}
