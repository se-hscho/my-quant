import { NextResponse } from "next/server";
import { fetchFxRatesFromYahoo } from "@/lib/agent/yahoo-quote";

export async function GET() {
  const { usdKrw, jpyKrw } = await fetchFxRatesFromYahoo();

  if (!usdKrw || !jpyKrw) {
    return NextResponse.json(
      { error: "FX rates unavailable" },
      { status: 502 }
    );
  }

  return NextResponse.json({
    usdKrw,
    jpyKrw,
    asOf: new Date().toISOString(),
  });
}
