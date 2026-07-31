import type { MetadataRoute } from "next";

const SITE = "https://www.kifurushiapp.com";

// Only pages that mean something to someone arriving cold. The dashboard, the
// review queue and the auth screens are either private or useless out of
// context, and listing them would just spend crawl budget on redirects to a
// sign-in page.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages: [string, MetadataRoute.Sitemap[number]["changeFrequency"], number][] = [
    ["", "daily", 1],
    ["/trips", "hourly", 0.9],
    ["/parcels", "hourly", 0.9],
    ["/pricing", "monthly", 0.8],
    ["/faq", "monthly", 0.8],
    ["/safety", "monthly", 0.7],
    ["/post/trip", "monthly", 0.6],
    ["/post/parcel", "monthly", 0.6],
    ["/terms", "yearly", 0.3],
    ["/privacy", "yearly", 0.3],
  ];

  return pages.map(([path, changeFrequency, priority]) => ({
    url: `${SITE}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
