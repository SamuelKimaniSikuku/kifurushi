import { ALL_COUNTRIES } from "./countries";

export interface RouteFilters {
  from: string;
  to: string;
  date: string;
  sort: "date" | "price" | "budget";
}

const countryCodes = new Set(ALL_COUNTRIES.map((country) => country.code));
const country = (value: string | null) => countryCodes.has(value ?? "") ? value! : "";

function readDate(value: string | null | undefined): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value ? value : "";
}

export function readRouteFilters(params: Pick<URLSearchParams, "get">): RouteFilters {
  const sort = params.get("sort");
  return {
    from: country(params.get("from")), to: country(params.get("to")),
    date: readDate(params.get("date")),
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

export function postHref(kind: "trip" | "parcel", filters: Pick<RouteFilters, "from" | "to"> & Partial<Pick<RouteFilters, "date">>) {
  const params = new URLSearchParams();
  if (countryCodes.has(filters.from)) params.set("fromCountry", filters.from);
  if (countryCodes.has(filters.to)) params.set("toCountry", filters.to);
  const date = readDate(filters.date);
  if (kind === "parcel" && date) params.set("neededBy", date);
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

/** The sender reviews the copied search date as an arrival deadline in the form. */
export function readParcelPrefill(params: Pick<URLSearchParams, "get">) {
  const neededBy = readDate(params.get("neededBy"));
  return { ...readPostRoute(params), ...(neededBy ? { neededBy } : {}) };
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
