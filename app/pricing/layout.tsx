import type { Metadata } from "next";

// The page itself is a client component (it translates in the browser), so
// its search identity lives here.
export const metadata: Metadata = {
  title: 'Pricing — free during launch',
  description:
    'Kifurushi is free while we launch. One membership covers sending and travelling, with 0% commission on every delivery — travellers keep everything they charge.',
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'Pricing — free during launch',
    description: 'Kifurushi is free while we launch. One membership covers sending and travelling, with 0% commission on every delivery — travellers keep everything they charge.',
    url: '/pricing',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
