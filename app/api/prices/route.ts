import { NextResponse } from "next/server";

interface YahooQuote {
  close: (number | null)[];
}

interface YahooAdjClose {
  adjclose: (number | null)[];
}

interface YahooResult {
  timestamp: number[];
  indicators: {
    quote: YahooQuote[];
    adjclose?: YahooAdjClose[];
  };
}

interface YahooChartResponse {
  chart: {
    result?: YahooResult[];
    error?: { code: string; description: string } | null;
  };
}

const ALLOWED_RANGES = new Set(["1y", "3y", "5y", "10y", "max"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get("ticker");
  const range = searchParams.get("range") ?? "10y";

  if (!ticker) {
    return NextResponse.json({ error: "ticker required" }, { status: 400 });
  }
  if (!ALLOWED_RANGES.has(range)) {
    return NextResponse.json({ error: "invalid range" }, { status: 400 });
  }
  if (!/^[A-Z][A-Z0-9.\-]{0,9}$/.test(ticker)) {
    return NextResponse.json({ error: "invalid ticker" }, { status: 400 });
  }

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    ticker
  )}?interval=1d&range=${range}`;

  let yahooRes: Response;
  try {
    yahooRes = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; quant-portfolio/1.0)" },
      cache: "no-store",
    });
  } catch (err) {
    return NextResponse.json(
      { error: "upstream fetch failed", detail: String(err) },
      { status: 502 }
    );
  }

  if (!yahooRes.ok) {
    return NextResponse.json(
      { error: `upstream ${yahooRes.status}` },
      { status: 502 }
    );
  }

  const data = (await yahooRes.json()) as YahooChartResponse;
  const result = data.chart.result?.[0];
  if (!result) {
    return NextResponse.json(
      { error: data.chart.error?.description ?? "no data" },
      { status: 404 }
    );
  }

  const timestamps = result.timestamp ?? [];
  const adjcloses = result.indicators.adjclose?.[0]?.adjclose;
  const rawCloses = result.indicators.quote[0]?.close ?? [];
  const series = adjcloses ?? rawCloses;

  const dates: string[] = [];
  const closeValues: number[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const c = series[i];
    if (c == null) continue;
    dates.push(new Date(timestamps[i] * 1000).toISOString().slice(0, 10));
    closeValues.push(c);
  }

  return NextResponse.json({ ticker, range, dates, closes: closeValues });
}
