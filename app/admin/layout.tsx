import type { Metadata } from "next";

// Private surface: crawlers only ever reach a sign-in wall here, and
// robots.txt disallow alone doesn't stop indexing-by-reference.
export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
