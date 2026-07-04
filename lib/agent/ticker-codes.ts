/** Yahoo/KRX 심볼 → 6자리 종목코드 (Wisereport·KRX용) */
export function toKrStockCode(ticker: string): string | null {
  const raw = ticker.trim().toUpperCase();
  const match = raw.match(/^(\d{6})(?:\.KS)?$/);
  return match ? match[1] : null;
}

/** 미국 상장 심볼 여부 — Finviz 등 공개 소스용 */
export function isUsListedSymbol(ticker: string): boolean {
  const raw = ticker.trim().toUpperCase();
  if (/^\d{6}(?:\.KS)?$/.test(raw)) return false;
  return /^[A-Z][A-Z0-9.-]{0,9}$/.test(raw);
}
