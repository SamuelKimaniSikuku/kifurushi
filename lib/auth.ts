"use client";

// Real auth + membership, backed by Supabase. Marketplace data (trips,
// parcels, matches, reviews) lives in lib/db.ts.

import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { reportIncident } from "./db";

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
  /**
   * True while the free first month is running. The member has full access,
   * but has paid nothing — so the UI says "free month, ends the 30th" rather
   * than letting them believe they are already subscribed and be surprised
   * when posting stops working.
   */
  isTrial: boolean;
  /**
   * True while the free month has not begun. It starts at the member's first
   * trip or parcel, so someone who signs up and doesn't post yet keeps the
   * whole month for when they actually use it.
   */
  trialDormant: boolean;
}

const FREE: Membership = {
  status: "free",
  plan: null,
  since: null,
  expires: null,
  isTrial: false,
  trialDormant: false,
};

export async function fetchMembership(): Promise<Membership> {
  const { data: auth } = await supabase.auth.getSession();
  const uid = auth.session?.user.id;
  if (!uid) return FREE;

  const { data } = await supabase
    .from("memberships")
    .select("status, plan, provider, created_at, current_period_end, trial_activated_at")
    .eq("user_id", uid)
    .maybeSingle();

  // 'infinity' means no end date — a dormant trial, or the launch period
  // during which trials never expire. Date parsing gives Invalid Date for it,
  // so it's resolved explicitly rather than left to chance.
  const openEnded =
    typeof data?.current_period_end === "string" &&
    data.current_period_end.startsWith("infinity");
  const dormant = data?.provider === "trial" && !data?.trial_activated_at;

  if (
    !data ||
    data.status !== "active" ||
    (!openEnded && new Date(data.current_period_end) <= new Date())
  ) {
    return FREE;
  }
  return {
    status: "member",
    plan: data.plan as BillingPlan,
    since: data.created_at,
    expires: openEnded ? null : data.current_period_end,
    isTrial: data.provider === "trial",
    trialDormant: dormant,
  };
}

export async function fetchIsMember(): Promise<boolean> {
  return (await fetchMembership()).status === "member";
}

// Which join flow the pricing page uses. "stripe" sends Join through
// hosted Checkout — currently on TEST keys (test card 4242… only) while
// the Stripe account awaits live activation. Set NEXT_PUBLIC_BILLING=beta
// to fall back to free self-enrolment.
export const BILLING_MODE: "beta" | "stripe" =
  process.env.NEXT_PUBLIC_BILLING === "beta" ? "beta" : "stripe";

/**
 * Keep paid checkout out of the launch experience. Set this explicitly to
 * "false" when the launch period ends and paid memberships are ready.
 */
export const FREE_LAUNCH_ACTIVE =
  process.env.NEXT_PUBLIC_FREE_LAUNCH !== "false";

/** Stripe Checkout: returns the hosted payment URL to redirect to. */
export async function startCheckout(plan: BillingPlan): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke("stripe-checkout", {
      body: { plan },
    });
    if (error) throw error;
    const url = (data as { url?: string })?.url;
    if (!url) throw new Error("No checkout URL returned");
    return url;
  } catch (e) {
    // Someone wanted to pay us and couldn't. Worth hearing about.
    await reportIncident("checkout_start_failed", "A member could not start checkout", {
      plan,
      message: (e as { message?: string })?.message,
    });
    throw e;
  }
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
