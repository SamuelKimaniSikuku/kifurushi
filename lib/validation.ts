import { z } from "zod";
import { ALL_COUNTRIES } from "./countries";

const countryCode = z
  .string()
  .refine((v) => ALL_COUNTRIES.some((c) => c.code === v), "Pick a country");

const city = z
  .string()
  .trim()
  .min(2, "City is too short")
  .max(60, "City is too long")
  .regex(/^[\p{L}\p{M}\s'’.-]+$/u, "City contains invalid characters");

const futureDate = z.string().refine((v) => {
  const d = new Date(v);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return !isNaN(d.getTime()) && d >= today;
}, "Date must be today or later");

export const tripSchema = z
  .object({
    fromCountry: countryCode,
    fromCity: city,
    toCountry: countryCode,
    toCity: city,
    departDate: futureDate,
    spaceKg: z.coerce.number().min(0.5, "Minimum 0.5 kg").max(46, "Max 46 kg (2 checked bags)"),
    pricePerKg: z.coerce.number().min(1, "Minimum $1/kg").max(100, "Max $100/kg"),
    notes: z.string().trim().max(400, "Keep notes under 400 characters"),
  })
  .refine((d) => d.fromCountry !== d.toCountry, {
    message: "Origin and destination must differ",
    path: ["toCountry"],
  });

export const parcelSchema = z
  .object({
    fromCountry: countryCode,
    fromCity: city,
    toCountry: countryCode,
    toCity: city,
    neededBy: futureDate,
    weightKg: z.coerce.number().min(0.1, "Minimum 0.1 kg").max(46, "Max 46 kg"),
    category: z.enum([
      "documents",
      "clothing",
      "electronics",
      "food",
      "medicine",
      "gifts",
      "books",
      "other",
    ]),
    description: z
      .string()
      .trim()
      .min(10, "Describe the parcel (at least 10 characters)")
      .max(400, "Keep the description under 400 characters"),
    budgetUsd: z.coerce.number().min(1, "Minimum $1").max(2000, "Max $2,000"),
  })
  .refine((d) => d.fromCountry !== d.toCountry, {
    message: "Origin and destination must differ",
    path: ["toCountry"],
  });

export const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name is too short")
    .max(80, "Name is too long")
    .regex(/^[\p{L}\p{M}\s'’.-]+$/u, "Name contains invalid characters"),
  email: z.string().trim().email("Enter a valid email"),
  password: z
    .string()
    .min(10, "Use at least 10 characters")
    .regex(/[a-z]/, "Add a lowercase letter")
    .regex(/[A-Z]/, "Add an uppercase letter")
    .regex(/[0-9]/, "Add a number"),
});

export const transitUpdateSchema = z
  .string()
  .trim()
  .min(3, "Update is too short")
  .max(200, "Keep updates under 200 characters");

export const reviewSchema = z.object({
  rating: z.number().int().min(1, "Pick a rating").max(5),
  comment: z.string().trim().max(300, "Keep the review under 300 characters"),
});

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

export const verificationSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{7,14}$/, "Use international format, e.g. +254712345678"),
  idType: z.enum(["passport", "national_id", "drivers_licence"], {
    message: "Pick an ID type",
  }),
  consent: z.literal(true, { message: "You must consent to the identity check" }),
});

export function validateUpload(file: File | null, label: string): string | "" {
  if (!file) return `${label} is required`;
  if (!ALLOWED_IMAGE_TYPES.includes(file.type))
    return `${label} must be a JPEG, PNG, WebP or HEIC image`;
  if (file.size > MAX_UPLOAD_BYTES) return `${label} must be under 8 MB`;
  return "";
}

export type FieldErrors = Record<string, string>;

export function zodErrors(err: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
