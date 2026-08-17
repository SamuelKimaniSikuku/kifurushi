import type { Metadata } from "next";

// The page itself is a client component (it translates in the browser), so
// its search identity lives here.
export const metadata: Metadata = {
  title: 'Parcels to carry — earn from your spare kilos',
  description:
    'Flying between Africa and the diaspora? Browse parcels waiting on your route and earn $7–12 per kilo of spare baggage. You keep 100% — Kifurushi takes no commission.',
  alternates: { canonical: '/parcels' },
  openGraph: {
    title: 'Parcels to carry — earn from your spare kilos',
    description: 'Flying between Africa and the diaspora? Browse parcels waiting on your route and earn $7–12 per kilo of spare baggage. You keep 100% — Kifurushi takes no commission.',
    url: '/parcels',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
