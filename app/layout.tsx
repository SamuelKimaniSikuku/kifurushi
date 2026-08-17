import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { LanguageProvider } from "@/lib/i18n";

const sora = Sora({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

// metadataBase makes every relative OG/canonical URL absolute, which is what
// WhatsApp, LinkedIn and Google actually require. The title template gives
// child pages "Page — Kifurushi" for free; pages that never set their own
// (auth, dashboard) fall back to the default and are noindexed anyway.
export const metadata: Metadata = {
  metadataBase: new URL("https://www.kifurushiapp.com"),
  title: {
    default: "Kifurushi — Africa's peer-to-peer parcel network",
    template: "%s — Kifurushi",
  },
  description:
    "Send parcels between Africa and the diaspora with verified travellers who are already flying your route. ID checks, sealed handovers, one-time delivery codes — and 0% commission.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Kifurushi",
    locale: "en_GB",
    url: "/",
    title: "Kifurushi — send parcels home with verified travellers",
    description:
      "Travellers earn from their spare kilos; senders pay about half the courier price. 54 African countries, 22 diaspora destinations. Free during launch.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kifurushi — send parcels home with verified travellers",
    description:
      "Travellers earn from their spare kilos; senders pay about half the courier price. Free during launch.",
  },
};

// Who we are, machine-readable. SearchAction lets Google understand the site
// shape; Organization backs up the name and logo in results.
const ORG_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Kifurushi",
  url: "https://www.kifurushiapp.com",
  logo: "https://www.kifurushiapp.com/icon.svg",
  email: "hello@kifurushiapp.com",
  description:
    "Peer-to-peer parcel network connecting senders and verified travellers between all 54 African countries and the diaspora.",
  sameAs: [],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sora.variable} ${inter.variable}`}>
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSONLD) }}
        />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-forest focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        <LanguageProvider>
          <div className="kente-strip" />
          <Nav />
          <main id="main" className="min-h-[70vh]">{children}</main>
          <Footer />
          <WhatsAppButton />
        </LanguageProvider>
      </body>
    </html>
  );
}
