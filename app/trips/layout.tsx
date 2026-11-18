import type { Metadata } from "next";

// The page itself is a client component (it translates in the browser), so
// its search identity lives here.
export const metadata: Metadata = {
  title: 'Find a traveller flying your route',
  description:
    'Find travellers with spare luggage space between Africa and the diaspora. Check verification and reviews, agree the fee, and compare it with your courier quote.',
  alternates: { canonical: '/trips' },
  openGraph: {
    title: 'Find a traveller flying your route',
    description: 'Find travellers with spare luggage space between Africa and the diaspora. Check verification and reviews, agree the fee, and compare it with your courier quote.',
    url: '/trips',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
