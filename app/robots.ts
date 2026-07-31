import type { MetadataRoute } from "next";

const SITE = "https://www.kifurushiapp.com";

// Members' own pages are kept out of the index deliberately. /dashboard and
// /admin are behind auth anyway, but a crawler that follows them only ever
// reaches a sign-in screen — and /people profiles carry real names and
// delivery histories, which belong to members rather than to search results.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/admin", "/auth", "/verify", "/people/"],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
