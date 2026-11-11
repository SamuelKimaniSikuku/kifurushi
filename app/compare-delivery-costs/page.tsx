import type { Metadata } from "next";
import DeliveryCostComparison from "@/components/DeliveryCostComparison";

const description = "Compare your DHL or other international courier quote with a Kifurushi traveller’s fee. Calculate potential savings using your own total prices.";
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
