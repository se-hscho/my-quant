import { Stock } from "@npmc_5/krxjs";
import type { InvestorTradingRow } from "@npmc_5/krxjs/dist/krx-types";
import "server-only";
import { recentBusinessDayYmd } from "@/lib/agent/trading-day";

export interface KrxInvestorFlow {
  dateYmd: string;
  foreignNetBuyBn: number;
  institutionNetBuyBn: number;
}

function parseNetBuyBn(raw: string | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/,/g, "").trim();
  if (!cleaned || cleaned === "-") return 0;
  const n = Number(cleaned);
  if (Number.isNaN(n)) return null;
  return Math.round((n / 1e12) * 100) / 100;
}

function pickInvestorRow(
  rows: InvestorTradingRow[],
  labelIncludes: string
): InvestorTradingRow | undefined {
  return rows.find((r) =>
    String(r.INVST_TP_NM ?? "").includes(labelIncludes)
  );
}

function extractRows(response: {
  output?: InvestorTradingRow[];
  OutBlock_1?: InvestorTradingRow[];
}): InvestorTradingRow[] {
  return response.output ?? response.OutBlock_1 ?? [];
}

function isKrxSessionError(payload: unknown): boolean {
  if (typeof payload === "string") {
    return payload.includes("LOGOUT");
  }
  if (payload && typeof payload === "object") {
    const raw = JSON.stringify(payload);
    return raw.includes("LOGOUT");
  }
  return false;
}

/** KRX 투자자별 거래대금 — 세션 없으면 실패(서버리스 기본). 성공 시 조원 단위 순매수. */
export async function fetchKrxInvestorFlow(
  dateYmd = recentBusinessDayYmd()
): Promise<KrxInvestorFlow | null> {
  try {
    const response = await Stock.getTradingValueByDate(dateYmd, dateYmd, "STK");
    if (isKrxSessionError(response)) return null;

    const rows = extractRows(response);
    if (rows.length === 0) return null;

    const foreign = pickInvestorRow(rows, "외국인");
    const institution = pickInvestorRow(rows, "기관");

    const foreignNetBuyBn = parseNetBuyBn(foreign?.NETBID_TRDVAL);
    const institutionNetBuyBn = parseNetBuyBn(institution?.NETBID_TRDVAL);

    if (foreignNetBuyBn === null && institutionNetBuyBn === null) {
      return null;
    }

    return {
      dateYmd,
      foreignNetBuyBn: foreignNetBuyBn ?? 0,
      institutionNetBuyBn: institutionNetBuyBn ?? 0,
    };
  } catch {
    return null;
  }
}
