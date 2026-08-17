import type { Metadata } from "next";

// The page itself is a client component (it translates in the browser), so
// its search identity lives here.
export const metadata: Metadata = {
  title: 'Send a parcel with a traveller',
  description:
    'Post what you need delivered between Africa and the diaspora, and verified travellers on your route will offer to carry it — usually in days, not weeks.',
  alternates: { canonical: '/post/parcel' },
  openGraph: {
    title: 'Send a parcel with a traveller',
    description: 'Post what you need delivered between Africa and the diaspora, and verified travellers on your route will offer to carry it — usually in days, not weeks.',
    url: '/post/parcel',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
