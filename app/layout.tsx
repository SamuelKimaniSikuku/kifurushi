import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Kifurushi — Africa's peer-to-peer parcel network",
  description:
    "Connect senders and travellers between all 54 African countries and the diaspora. Verified travellers, coded handovers, zero commission — one membership.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="kente-strip" />
        <Nav />
        <main className="min-h-[70vh]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
