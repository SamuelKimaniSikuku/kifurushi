import type { Metadata } from "next";

// The page itself is a client component (it translates in the browser), so
// its search identity lives here.
export const metadata: Metadata = {
  title: 'Find a traveller flying your route',
  description:
    'Browse verified travellers with spare luggage space between Africa and the diaspora. Send your parcel with someone already flying — typically $7–12/kg, about half the courier price.',
  alternates: { canonical: '/trips' },
  openGraph: {
    title: 'Find a traveller flying your route',
    description: 'Browse verified travellers with spare luggage space between Africa and the diaspora. Send your parcel with someone already flying — typically $7–12/kg, about half the courier price.',
    url: '/trips',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
