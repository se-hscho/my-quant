import "server-only";

export interface NaverKospiInvestorFlow {
  dateYmd: string;
  foreignNetBuyBn: number;
  institutionNetBuyBn: number;
}

/** "+44,079" / "-21,750" — 억원 단위 → 조원 */
export function parseNaverFlowBn(raw: string | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/,/g, "").replace(/^\+/, "").trim();
  if (!cleaned || cleaned === "-") return 0;
  const n = Number(cleaned);
  if (Number.isNaN(n)) return null;
  return Math.round((n / 10_000) * 100) / 100;
}

function ymdToIso(ymd: string): string {
  if (ymd.length !== 8) return new Date().toISOString().slice(0, 10);
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
}

/** Npay 모바일 API — KOSPI 투자자별 순매수(억원), API key 불필요 */
export async function fetchNaverKospiInvestorFlow(): Promise<
  (NaverKospiInvestorFlow & { asOfDate: string }) | null
> {
  try {
    const res = await fetch(
      "https://m.stock.naver.com/api/index/KOSPI/trend?pageSize=1",
      {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; quant-portfolio/1.0)" },
        next: { revalidate: 900 },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return null;

    const data = (await res.json()) as {
      bizdate?: string;
      foreignValue?: string;
      institutionalValue?: string;
    };

    const dateYmd = data.bizdate;
    if (!dateYmd) return null;

    const foreignNetBuyBn = parseNaverFlowBn(data.foreignValue);
    const institutionNetBuyBn = parseNaverFlowBn(data.institutionalValue);

    if (foreignNetBuyBn === null && institutionNetBuyBn === null) {
      return null;
    }

    return {
      dateYmd,
      asOfDate: ymdToIso(dateYmd),
      foreignNetBuyBn: foreignNetBuyBn ?? 0,
      institutionNetBuyBn: institutionNetBuyBn ?? 0,
    };
  } catch {
    return null;
  }
}
