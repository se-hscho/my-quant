import { DEMO_MARKET_SEED } from "@/lib/agent/market-data";
import {
  deriveAvgCostFromPaste,
  deriveCostKrwFromReturn,
  derivePnlKrwFromReturn,
  nativeAmountFromKrw,
} from "@/lib/agent/cost-from-return";
import type { FxRates } from "@/lib/agent/valuation";
import { fetchFxRatesFromYahoo, fetchYahooLatestClose } from "@/lib/agent/yahoo-quote";
import type { BrokeragePasteRow } from "@/services/agent/brokerage-paste-llm";

export interface EnrichedPasteRow extends BrokeragePasteRow {
  costKrw?: number;
  pnlKrw?: number;
  avgCost?: number;
  currentPrice?: number;
}

async function resolveFx(): Promise<FxRates> {
  const raw = await fetchFxRatesFromYahoo();
  return {
    usdKrw: raw.usdKrw ?? DEMO_MARKET_SEED.fx.usdKrw,
    jpyKrw: raw.jpyKrw ?? DEMO_MARKET_SEED.fx.jpyKrw,
  };
}

/** LLM 파싱 결과에 Yahoo 시세로 수량·매수가를 역산 보정 */
export async function enrichBrokeragePasteRows(
  rows: BrokeragePasteRow[]
): Promise<EnrichedPasteRow[]> {
  const fx = await resolveFx();

  return Promise.all(
    rows.map(async (row) => {
      const costKrw =
        row.returnPct != null
          ? deriveCostKrwFromReturn(row.valueKrw, row.returnPct)
          : undefined;
      const pnlKrw =
        row.returnPct != null
          ? derivePnlKrwFromReturn(row.valueKrw, row.returnPct)
          : undefined;

      const currentPrice = await fetchYahooLatestClose(row.ticker);
      let quantity = row.quantity;
      let avgCost: number | undefined;

      if (currentPrice != null && currentPrice > 0) {
        const valueNative = nativeAmountFromKrw(row.valueKrw, row.currency, fx);
        quantity = Math.max(
          0.0001,
          Math.round((valueNative / currentPrice) * 10_000) / 10_000
        );

        if (row.returnPct != null) {
          avgCost = deriveAvgCostFromPaste({
            valueKrw: row.valueKrw,
            returnPct: row.returnPct,
            quantity,
            currency: row.currency,
            fx,
          });
        }
      } else if (row.returnPct != null) {
        quantity = row.quantity > 0 ? row.quantity : 1;
        avgCost = deriveAvgCostFromPaste({
          valueKrw: row.valueKrw,
          returnPct: row.returnPct,
          quantity,
          currency: row.currency,
          fx,
        });
      }

      return {
        ...row,
        quantity,
        costKrw: Number.isFinite(costKrw) ? Math.round(costKrw!) : undefined,
        pnlKrw: pnlKrw != null ? Math.round(pnlKrw) : undefined,
        avgCost,
        currentPrice: currentPrice ?? undefined,
      };
    })
  );
}
