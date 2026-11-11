import type { Metadata } from "next";
import DeliveryCostComparison from "@/components/DeliveryCostComparison";

const description = "Estimate your Kifurushi delivery cost from parcel weight and a traveller’s price per kg. Add a DHL or other courier quote to compare potential savings.";
export const metadata: Metadata = {
  title: "Compare DHL and courier costs with Kifurushi",
  description,
  alternates: { canonical: "/compare-delivery-costs" },
  openGraph: { title: "Could your parcel cost less with Kifurushi?", description, url: "/compare-delivery-costs" },
  twitter: { card: "summary_large_image", title: "Compare delivery costs with Kifurushi", description },
};

export default function CompareDeliveryCostsPage() {
  return <DeliveryCostComparison />;
}
