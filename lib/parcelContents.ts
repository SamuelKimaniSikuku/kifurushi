import { z } from "zod";
export { acceptsContents } from "../supabase/functions/_shared/itemCategories";
export const packageTypes = ["envelope", "small_box", "large_box", "suitcase", "not_sure"] as const;
export const parcelDetailsSchema = z.object({
 itemCount: z.preprocess(v => v == null || v === "" ? null : v, z.coerce.number().int().min(1).max(10000).nullable()),
 packageType: z.enum(packageTypes),
 weightKind: z.enum(["measured", "estimated"]).nullable(),
});
export function weightInKg(value: string, unit: "kg"|"g"): string {
 if (!value.trim()) return "";
 if (unit === "kg") return value;
 const n = Number(value);
 return Number.isFinite(n) ? String(Number((n / 1000).toPrecision(12))) : value;
}
export function displayWeight(kg: number): string { return kg < 1 ? `${Number((kg * 1000).toPrecision(12))} g` : `${kg} kg`; }
