/** 종목 가격 변동률(%) — 어제·7일·약 1개월(22거래일) 전 대비 */
export interface PriceTrendPct {
  d1: number | null;
  d7: number | null;
  m1: number | null;
}

export function pctChange(latest: number, past: number): number | null {
  if (!Number.isFinite(latest) || !Number.isFinite(past) || past <= 0) return null;
  return ((latest - past) / past) * 100;
}

/** 시간순 종가 배열(마지막=최신)에서 기간별 변동률 계산 */
export function computePriceTrendFromCloses(closes: number[]): PriceTrendPct {
  if (closes.length < 2) {
    return { d1: null, d7: null, m1: null };
  }

  const latest = closes[closes.length - 1];
  const pastAt = (n: number): number | null => {
    let count = 0;
    for (let i = closes.length - 2; i >= 0; i--) {
      count++;
      if (count === n) return closes[i];
    }
    return null;
  };

  return {
    d1: pctChange(latest, pastAt(1) ?? NaN),
    d7: pctChange(latest, pastAt(7) ?? NaN),
    m1: pctChange(latest, pastAt(22) ?? NaN),
  };
}

export function formatTrendPct(pct: number | null | undefined): string {
  if (pct == null || !Number.isFinite(pct)) return "—";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}
