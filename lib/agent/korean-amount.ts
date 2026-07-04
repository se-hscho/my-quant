/** 한글 금액 표현 → 숫자 (원) */
const NATIVE_MAN: Record<string, number> = {
  일만: 10_000,
  이만: 20_000,
  삼만: 30_000,
  사만: 40_000,
  오만: 50_000,
  육만: 60_000,
  칠만: 70_000,
  팔만: 80_000,
  구만: 90_000,
  십만: 100_000,
  백만: 1_000_000,
  천만: 10_000_000,
  일억: 100_000_000,
};

export function parseKoreanAmount(raw: string): number {
  let cleaned = raw.replace(/,/g, "").trim();
  cleaned = cleaned.replace(/원$/g, "");

  if (NATIVE_MAN[cleaned] !== undefined) {
    return NATIVE_MAN[cleaned];
  }

  const man = cleaned.match(/^(\d+(?:\.\d+)?)만$/);
  if (man) return Math.round(parseFloat(man[1]) * 10_000);

  const eok = cleaned.match(/^(\d+(?:\.\d+)?)억$/);
  if (eok) return Math.round(parseFloat(eok[1]) * 100_000_000);

  const cheon = cleaned.match(/^(\d+(?:\.\d+)?)천$/);
  if (cheon) return Math.round(parseFloat(cheon[1]) * 1_000);

  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
