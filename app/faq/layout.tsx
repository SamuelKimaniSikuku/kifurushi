import type { Metadata } from "next";

// Metadata lives here because the page itself is a client component — it has
// to be, to answer in the reader's own language.
export const metadata: Metadata = {
  title: "Questions people ask — Kifurushi",
  description:
    "How Kifurushi works, what it costs, who carries your parcel, what happens if something goes wrong, and what we deliberately do not do.",
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
