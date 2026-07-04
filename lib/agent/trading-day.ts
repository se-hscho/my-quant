/** 최근 영업일(YYYYMMDD) — 주말만 제외, 공휴일은 KRX 응답으로 폴백 */
export function recentBusinessDayYmd(
  from: Date = new Date(),
  maxLookback = 10
): string {
  const d = new Date(from);
  for (let i = 0; i < maxLookback; i += 1) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      return d.toISOString().slice(0, 10).replace(/-/g, "");
    }
    d.setDate(d.getDate() - 1);
  }
  return from.toISOString().slice(0, 10).replace(/-/g, "");
}
