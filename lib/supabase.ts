"use client";

import { createClient } from "@supabase/supabase-js";

// Browser-side Supabase client. The whole app is client components, so a
// single localStorage-persisted client is all we need. RLS does the real
// enforcement — the anon key ships to every browser regardless, so the
// committed fallbacks below leak nothing; env vars still win when set.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
    "https://bltaaidjhpkmwnsprenu.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsdGFhaWRqaHBrbXduc3ByZW51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MTQ1NjUsImV4cCI6MjA4ODE5MDU2NX0.lFswvrfnM6tFBgKNWbM2jL1wrmYMnslXyTuY-vhWHKM"
);
