"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { browseHref, readRouteFilters, type RouteFilters } from "./routes";

export function useBrowseFilters(path: "/trips" | "/parcels") {
  const params = useSearchParams();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const filters = readRouteFilters(params);
  function update(values: Partial<RouteFilters>) {
    startTransition(() => router.replace(browseHref(path, { ...filters, ...values }), { scroll: false }));
  }
  const clear = () => update({ from: "", to: "", date: "", sort: "date" });
  return { filters, update, clear, pending };
}
