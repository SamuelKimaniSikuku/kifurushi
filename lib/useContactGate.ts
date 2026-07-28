"use client";

// The single gate for "can this user contact someone". Every page that opens a
// conversation (trips, parcels, a person's profile) must go through this hook —
// keeping one copy means a new requirement can't be added to one page and
// missed on another, which would leave that page a paywall bypass.

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { fetchSession, fetchIsMember } from "@/lib/auth";

/**
 * Returns a function to call before any contact action. It performs the
 * redirect itself and resolves false when the user is blocked; true means the
 * caller may proceed.
 */
export function useContactGate(): () => Promise<boolean> {
  const router = useRouter();
  const pathname = usePathname();

  return useCallback(async () => {
    if (!(await fetchSession())) {
      router.push(`/auth?next=${encodeURIComponent(pathname)}`);
      return false;
    }
    if (!(await fetchIsMember())) {
      router.push("/pricing?reason=contact");
      return false;
    }
    return true;
  }, [router, pathname]);
}
