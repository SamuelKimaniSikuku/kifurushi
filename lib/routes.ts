import { ALL_COUNTRIES } from "./countries";

export interface RouteFilters {
  from: string;
  to: string;
  date: string;
  sort: "date" | "price" | "budget";
}

const countryCodes = new Set(ALL_COUNTRIES.map((country) => country.code));
const country = (value: string | null) => countryCodes.has(value ?? "") ? value! : "";

export function readRouteFilters(params: Pick<URLSearchParams, "get">): RouteFilters {
  const date = params.get("date") ?? "";
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !Number.isNaN(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date;
  const sort = params.get("sort");
  return {
    from: country(params.get("from")), to: country(params.get("to")),
    date: validDate ? date : "",
    sort: sort === "price" || sort === "budget" ? sort : "date",
  };
}

export function browseHref(path: "/trips" | "/parcels", filters: Partial<RouteFilters> = {}) {
  const params = new URLSearchParams();
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.date) params.set("date", filters.date);
  if (filters.sort && filters.sort !== "date") params.set("sort", filters.sort);
  return params.size ? `${path}?${params}` : path;
}

export function postHref(kind: "trip" | "parcel", filters: Pick<RouteFilters, "from" | "to">) {
  const params = new URLSearchParams();
  if (countryCodes.has(filters.from)) params.set("fromCountry", filters.from);
  if (countryCodes.has(filters.to)) params.set("toCountry", filters.to);
  return params.size ? `/post/${kind}?${params}` : `/post/${kind}`;
}

export function readPostRoute(params: Pick<URLSearchParams, "get">) {
  const fromCountry = country(params.get("fromCountry"));
  const toCountry = country(params.get("toCountry"));
  return {
    ...(fromCountry ? { fromCountry, fromCity: params.get("fromCity") ?? "" } : {}),
    ...(toCountry ? { toCountry, toCity: params.get("toCity") ?? "" } : {}),
  };
}

/** Only relative paths within this app may be used after authentication. */
export function safeReturnPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020]/.test(value)) return "/dashboard";
  try {
    const url = new URL(value, "https://www.kifurushiapp.com");
    const decodedPath = decodeURIComponent(url.pathname);
    if (decodedPath.startsWith("//") || /[\\\u0000-\u001f]/.test(decodedPath)) return "/dashboard";
    if (url.origin !== "https://www.kifurushiapp.com" || /^\/auth\/?$/.test(decodedPath)) return "/dashboard";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch { return "/dashboard"; }
}
