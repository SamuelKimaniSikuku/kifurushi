"use client";

// Real auth + membership, backed by Supabase. Replaces the localStorage
// session/membership demo in lib/store.ts. Trips/parcels/matches remain on
// the demo store until they are migrated in turn.

import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export interface Session {
  userId: string;
  name: string;
  email: string;
}

function toSession(user: {
  id: string;
  email?: string;
  user_metadata: Record<string, unknown>;
}): Session {
  return {
    userId: user.id,
    name:
      (typeof user.user_metadata.full_name === "string" &&
        user.user_metadata.full_name) ||
      "Member",
    email: user.email ?? "",
  };
}

export async function fetchSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  return user ? toSession(user) : null;
}

/** Live session for components: null while signed out, updates on auth changes. */
export function useSession(): { session: Session | null; loading: boolean } {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchSession().then((s) => {
      if (mounted) {
        setSession(s);
        setLoading(false);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (mounted) setSession(s?.user ? toSession(s.user) : null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, loading };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

// ---- Membership ----
// Backed by public.memberships. During the beta users self-enroll (no payment
// provider); the BETA ONLY RLS policies cap self-granted periods at one year.

export type BillingPlan = "monthly" | "yearly";

export interface Membership {
  status: "free" | "member";
  plan: BillingPlan | null;
  since: string | null;
  expires: string | null;
}

const FREE: Membership = { status: "free", plan: null, since: null, expires: null };

export async function fetchMembership(): Promise<Membership> {
  const { data: auth } = await supabase.auth.getSession();
  const uid = auth.session?.user.id;
  if (!uid) return FREE;

  const { data } = await supabase
    .from("memberships")
    .select("status, plan, created_at, current_period_end")
    .eq("user_id", uid)
    .maybeSingle();

  if (
    !data ||
    data.status !== "active" ||
    new Date(data.current_period_end) <= new Date()
  ) {
    return FREE;
  }
  return {
    status: "member",
    plan: data.plan as BillingPlan,
    since: data.created_at,
    expires: data.current_period_end,
  };
}

export async function fetchIsMember(): Promise<boolean> {
  return (await fetchMembership()).status === "member";
}

/** Beta self-enrolment: writes a real membership row, no payment yet. */
export async function joinMembership(plan: BillingPlan): Promise<Membership> {
  const { data: auth } = await supabase.auth.getSession();
  const uid = auth.session?.user.id;
  if (!uid) throw new Error("Not signed in");

  const end = new Date();
  if (plan === "monthly") end.setMonth(end.getMonth() + 1);
  else end.setFullYear(end.getFullYear() + 1);
  // The beta RLS policy caps periods at server-now + 1 year; back off an hour
  // so client/server clock skew can't push us over the cap.
  end.setHours(end.getHours() - 1);

  const { error } = await supabase.from("memberships").upsert({
    user_id: uid,
    status: "active",
    plan,
    provider: "beta",
    current_period_end: end.toISOString(),
  });
  if (error) throw error;
  return fetchMembership();
}
