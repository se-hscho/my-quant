import type { EvidenceLink } from "@/types/deployment";

/** 공개 근거 링크 — 사용자가 사실 확인용 (참고용) */
export const PUBLIC_EVIDENCE_LINKS = {
  naverInvestorFlow: {
    title: "Naver Finance — KOSPI 투자자별 순매수",
    url: "https://finance.naver.com/sise/sise_deposit.naver",
    type: "market_data" as const,
  },
  fedCalendar: {
    title: "Federal Reserve — FOMC 일정",
    url: "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm",
    type: "policy" as const,
  },
  secEdgar: {
    title: "SEC EDGAR — 미국 공시",
    url: "https://www.sec.gov/edgar/search/",
    type: "disclosure" as const,
  },
  dartKr: {
    title: "DART — 전자공시",
    url: "https://dart.fss.or.kr/",
    type: "disclosure" as const,
  },
  yahooFx: {
    title: "Yahoo Finance — USD/KRW",
    url: "https://finance.yahoo.com/quote/KRW=X/",
    type: "market_data" as const,
  },
} satisfies Record<string, EvidenceLink>;

export function evidenceLinks(...keys: (keyof typeof PUBLIC_EVIDENCE_LINKS)[]): EvidenceLink[] {
  return keys.map((k) => PUBLIC_EVIDENCE_LINKS[k]);
}
