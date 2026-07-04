import type { AnalystRow } from "@/services/briefing/types";
import "server-only";
import { isUsListedSymbol } from "@/lib/agent/ticker-codes";

const FINVIZ_TIMEOUT_MS = Number(process.env.FINVIZ_TIMEOUT_MS ?? 6000);

function finvizRating(recom: number): string {
  if (recom <= 1.5) return "Strong Buy";
  if (recom <= 2.5) return "Buy";
  if (recom <= 3.5) return "Hold";
  if (recom <= 4.5) return "Sell";
  return "Strong Sell";
}

function parseSnapshotPairs(html: string): Map<string, string> {
  const labels = [
    ...html.matchAll(/class="snapshot-td-label"[^>]*>([\s\S]*?)<\/div>/g),
  ].map((m) => m[1].replace(/<[^>]+>/g, "").trim());

  const values = [
    ...html.matchAll(
      /class="snapshot-td2[^"]*"[^>]*>[\s\S]*?class="snapshot-td-content"[^>]*>([\s\S]*?)<\/div>/g
    ),
  ].map((m) => m[1].replace(/<[^>]+>/g, "").trim());

  const map = new Map<string, string>();
  labels.forEach((label, i) => {
    if (values[i]) map.set(label, values[i]);
  });
  return map;
}

async function fetchFinvizSnapshot(symbol: string): Promise<Map<string, string> | null> {
  try {
    const res = await fetch(
      `https://finviz.com/quote.ashx?t=${encodeURIComponent(symbol)}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        signal: AbortSignal.timeout(FINVIZ_TIMEOUT_MS),
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return null;
    const html = await res.text();
    if (html.includes("Invalid ticker")) return null;
    return parseSnapshotPairs(html);
  } catch {
    return null;
  }
}

function toAnalystRow(symbol: string, snapshot: Map<string, string>): AnalystRow | null {
  const recomRaw = snapshot.get("Recom");
  if (!recomRaw) return null;

  const recom = Number(recomRaw);
  if (Number.isNaN(recom)) return null;

  const targetRaw = snapshot.get("Target Price");
  const targetPrice = targetRaw
    ? Number(targetRaw.replace(/,/g, ""))
    : undefined;

  return {
    ticker: symbol.toUpperCase(),
    broker: "Finviz 컨센서스",
    date: new Date().toISOString().slice(0, 10),
    rating: finvizRating(recom),
    targetPrice: Number.isFinite(targetPrice) ? targetPrice : undefined,
    summary: `Finviz Recom ${recom.toFixed(2)} (1=Strong Buy, 5=Strong Sell) · 공개 스냅샷`,
    sourceUrl: `https://finviz.com/quote.ashx?t=${encodeURIComponent(symbol)}`,
  };
}

/** Finviz HTML 스냅샷 — US 주식 Recom/Target (ETF는 데이터 없을 수 있음) */
export async function fetchFinvizPublicReports(
  tickers: string[]
): Promise<AnalystRow[]> {
  if (process.env.ANALYST_LIVE_DISABLED === "1") return [];

  const symbols = [
    ...new Set(
      tickers.filter(isUsListedSymbol).map((t) => t.trim().toUpperCase())
    ),
  ];
  if (symbols.length === 0) return [];

  const rows = await Promise.all(
    symbols.map(async (symbol) => {
      const snapshot = await fetchFinvizSnapshot(symbol);
      if (!snapshot) return null;
      return toAnalystRow(symbol, snapshot);
    })
  );

  return rows.filter((row): row is AnalystRow => row !== null);
}
