import Krxjs from "@npmc_5/krxjs";
import type { AnalystRow } from "@/services/briefing/types";
import "server-only";
import { toKrStockCode } from "@/lib/agent/ticker-codes";

interface BrokerTargetRow {
  제공처?: string;
  최종일자?: string;
  목표가?: string;
  투자의견?: string;
}

const WISEREPORT_TIMEOUT_MS = Number(
  process.env.WISEREPORT_TIMEOUT_MS ?? 5000
);

function parseWisereportDate(raw: string | undefined): string {
  if (!raw) return new Date().toISOString().slice(0, 10);
  const slash = raw.match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
  if (slash) {
    return `20${slash[1]}-${slash[2]}-${slash[3]}`;
  }
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  return new Date().toISOString().slice(0, 10);
}

function parseTargetPrice(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw.replace(/,/g, "").trim());
  return Number.isNaN(n) ? undefined : n;
}

function normalizeRating(raw: string | undefined): string {
  const text = (raw ?? "").replace(/펼치기/g, "").trim();
  if (!text) return "Hold";
  if (/매수|buy/i.test(text)) return "Buy";
  if (/매도|sell/i.test(text)) return "Sell";
  if (/중립|hold/i.test(text)) return "Hold";
  return text;
}

function toAnalystRow(ticker: string, row: BrokerTargetRow): AnalystRow | null {
  const broker = row.제공처?.trim();
  if (!broker) return null;

  return {
    ticker,
    broker,
    date: parseWisereportDate(row.최종일자),
    rating: normalizeRating(row.투자의견),
    targetPrice: parseTargetPrice(row.목표가),
    summary: `${broker} 목표가 ${row.목표가 ?? "-"}원 · Wisereport 공개 컨센서스`,
    sourceUrl: `https://comp.wisereport.co.kr/company/c1010001.aspx?cmp_cd=${toKrStockCode(ticker) ?? ""}`,
  };
}

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number
): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function fetchTickerReports(
  code: string,
  displayTicker: string
): Promise<AnalystRow[]> {
  const overview = await withTimeout(
    Krxjs.getCompanyOverview(code),
    WISEREPORT_TIMEOUT_MS
  );
  if (!overview) return [];

  const targets = (overview.brokerTargets ?? []) as BrokerTargetRow[];
  return targets
    .slice(0, 3)
    .map((target) => toAnalystRow(displayTicker, target))
    .filter((row): row is AnalystRow => row !== null);
}

export async function fetchKrWisereportReports(
  tickers: string[]
): Promise<AnalystRow[]> {
  if (process.env.ANALYST_LIVE_DISABLED === "1") return [];

  const codes = [
    ...new Map(
      tickers
        .map((t) => {
          const code = toKrStockCode(t);
          if (!code) return null;
          const display = t.includes(".") ? t.toUpperCase() : `${code}.KS`;
          return [code, display] as const;
        })
        .filter(Boolean) as Array<readonly [string, string]>
    ).entries(),
  ];

  if (codes.length === 0) return [];

  const batches = await Promise.all(
    codes.map(([code, displayTicker]) =>
      fetchTickerReports(code, displayTicker).catch(() => [])
    )
  );

  return batches.flat();
}
