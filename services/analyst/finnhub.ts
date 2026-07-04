import type { AnalystRow } from "@/services/briefing/types";
import "server-only";
import { isUsListedSymbol } from "@/lib/agent/ticker-codes";

interface FinnhubRecommendation {
  symbol: string;
  period: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
}

function finnhubApiKey(): string | null {
  return process.env.FINNHUB_API_KEY?.trim() || null;
}

function consensusRating(row: FinnhubRecommendation): string {
  const scores = [
    { label: "Strong Buy", n: row.strongBuy },
    { label: "Buy", n: row.buy },
    { label: "Hold", n: row.hold },
    { label: "Sell", n: row.sell },
    { label: "Strong Sell", n: row.strongSell },
  ];
  const top = scores.toSorted((a, b) => b.n - a.n)[0];
  if (!top || top.n === 0) return "Hold";
  return top.label;
}

function periodToIsoDate(period: string): string {
  const m = period.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return new Date().toISOString().slice(0, 10);
}

function toAnalystRow(
  symbol: string,
  latest: FinnhubRecommendation
): AnalystRow {
  const rating = consensusRating(latest);
  const total =
    latest.strongBuy +
    latest.buy +
    latest.hold +
    latest.sell +
    latest.strongSell;

  return {
    ticker: symbol.toUpperCase(),
    broker: "Finnhub 컨센서스",
    date: periodToIsoDate(latest.period),
    rating,
    summary: `애널 ${total}명 — Strong Buy ${latest.strongBuy}, Buy ${latest.buy}, Hold ${latest.hold}, Sell ${latest.sell + latest.strongSell}`,
    sourceUrl: `https://finnhub.io/docs/api/recommendation-trends`,
  };
}

export async function fetchFinnhubRecommendations(
  tickers: string[]
): Promise<AnalystRow[]> {
  const key = finnhubApiKey();
  if (!key) return [];

  const usSymbols = [
    ...new Set(
      tickers.filter(isUsListedSymbol).map((t) => t.trim().toUpperCase())
    ),
  ];
  if (usSymbols.length === 0) return [];

  const rows: AnalystRow[] = [];

  await Promise.all(
    usSymbols.map(async (symbol) => {
      try {
        const url = `https://finnhub.io/api/v1/stock/recommendation?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(key)}`;
        const res = await fetch(url, { next: { revalidate: 3600 } });
        if (!res.ok) return;
        const data = (await res.json()) as FinnhubRecommendation[];
        if (!Array.isArray(data) || data.length === 0) return;
        rows.push(toAnalystRow(symbol, data[0]));
      } catch {
        /* skip symbol */
      }
    })
  );

  return rows;
}

export function isFinnhubConfigured(): boolean {
  return Boolean(finnhubApiKey());
}
