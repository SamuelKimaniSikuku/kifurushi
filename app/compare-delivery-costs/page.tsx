import type { Metadata } from "next";
import DeliveryCostComparison from "@/components/DeliveryCostComparison";

const description = "Calculate parcel costs from your route and weight using upcoming Kifurushi listings and verified published courier tariffs where available.";
export const metadata: Metadata = {
  title: "Parcel cost calculator",
  description,
  alternates: { canonical: "/compare-delivery-costs" },
  openGraph: { title: "Calculate your parcel cost", description, url: "/compare-delivery-costs" },
  twitter: { card: "summary_large_image", title: "Calculate parcel costs with Kifurushi", description },
};

export default function CompareDeliveryCostsPage() {
  return <DeliveryCostComparison />;
}
