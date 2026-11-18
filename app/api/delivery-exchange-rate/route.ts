import { NextResponse } from "next/server";
import { parseEcbRate, parseReferenceRates } from "@/lib/automaticDeliveryCosts";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await fetch("https://api.frankfurter.dev/v2/rates?base=EUR&quotes=USD,KES,GBP,INR", {
      next: { revalidate: 3600 }, signal: AbortSignal.timeout(5000),
    });
    if (response.ok) {
      const rates = parseReferenceRates(await response.json());
      if (rates) return NextResponse.json(rates);
    }
  } catch { /* The ECB feed below can still supply some currencies. */ }
  try {
    const response = await fetch("https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml", {
      next: { revalidate: 3600 }, signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error("Reference feed unavailable");
    const rate = parseEcbRate(await response.text());
    if (!rate) throw new Error("No recent reference rate");
    return NextResponse.json({ ...rate, source: "ecb" });
  } catch {
    // Clients retain the original USD/EUR prices and suppress cross-currency savings.
    return NextResponse.json({ error: "Exchange rate unavailable" }, { status: 503 });
  }
}
