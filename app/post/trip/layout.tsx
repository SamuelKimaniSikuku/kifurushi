import type { Metadata } from "next";

// The page itself is a client component (it translates in the browser), so
// its search identity lives here.
export const metadata: Metadata = {
  title: 'Post your trip — earn from spare luggage',
  description:
    "Tell senders where you're flying and how many spare kilos you have. Ten spare kilos is typically worth about $90 on a flight you were taking anyway.",
  alternates: { canonical: '/post/trip' },
  openGraph: {
    title: 'Post your trip — earn from spare luggage',
    description: "Tell senders where you're flying and how many spare kilos you have. Ten spare kilos is typically worth about $90 on a flight you were taking anyway.",
    url: '/post/trip',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
