import { NextResponse } from "next/server";
import { parseEcbRate } from "@/lib/automaticDeliveryCosts";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await fetch("https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml", {
      next: { revalidate: 3600 }, signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error("Reference feed unavailable");
    const rate = parseEcbRate(await response.text());
    if (!rate) throw new Error("No recent reference rate");
    return NextResponse.json(rate);
  } catch {
    // Clients retain the original USD/EUR prices and suppress cross-currency savings.
    return NextResponse.json({ error: "Exchange rate unavailable" }, { status: 503 });
  }
}
