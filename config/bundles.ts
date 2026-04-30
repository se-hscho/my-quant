import type { Bundle } from "@/types";

export const BUNDLES: Bundle[] = [
  {
    id: "ai-semiconductor",
    name: "AI & 반도체",
    category: "테마형",
    description: "AI 인프라와 반도체 핵심 종목",
    stocks: [
      { ticker: "NVDA", name: "NVIDIA", description: "AI GPU 시장 점유율 1위" },
      { ticker: "AMD", name: "Advanced Micro Devices", description: "데이터센터 CPU/GPU" },
      { ticker: "TSM", name: "Taiwan Semiconductor", description: "세계 최대 파운드리" },
      { ticker: "AVGO", name: "Broadcom", description: "AI 네트워크 칩" },
      { ticker: "ASML", name: "ASML Holding", description: "EUV 노광 장비 독점" },
    ],
  },
  {
    id: "bigtech-cloud",
    name: "빅테크 & 클라우드",
    category: "테마형",
    description: "글로벌 클라우드·플랫폼 빅테크",
    stocks: [
      { ticker: "MSFT", name: "Microsoft", description: "Azure 클라우드, MS Office" },
      { ticker: "GOOGL", name: "Alphabet", description: "검색·광고·GCP" },
      { ticker: "AMZN", name: "Amazon", description: "AWS·이커머스" },
      { ticker: "META", name: "Meta Platforms", description: "광고·SNS·VR" },
      { ticker: "AAPL", name: "Apple", description: "iPhone·서비스" },
    ],
  },
  {
    id: "low-volatility",
    name: "Low Volatility",
    category: "팩터형",
    description: "변동성이 낮은 안정적 대형주",
    stocks: [
      { ticker: "JNJ", name: "Johnson & Johnson", description: "글로벌 헬스케어" },
      { ticker: "PG", name: "Procter & Gamble", description: "생활용품 다국적" },
      { ticker: "KO", name: "Coca-Cola", description: "글로벌 음료" },
      { ticker: "PEP", name: "PepsiCo", description: "음료·스낵" },
      { ticker: "WMT", name: "Walmart", description: "글로벌 리테일" },
    ],
  },
  {
    id: "all-weather",
    name: "All-Weather",
    category: "전통 배분",
    description: "주식·채권·금·원자재 분산",
    stocks: [
      { ticker: "VTI", name: "Vanguard Total Stock Market", description: "미국 전체 주식" },
      { ticker: "TLT", name: "iShares 20+ Year Treasury", description: "장기 미국 국채" },
      { ticker: "IEF", name: "iShares 7-10 Year Treasury", description: "중기 국채" },
      { ticker: "GLD", name: "SPDR Gold Shares", description: "금" },
      { ticker: "DBC", name: "Invesco DB Commodity", description: "원자재" },
    ],
  },
  {
    id: "berkshire-top",
    name: "Berkshire Top 10",
    category: "기관 따라하기",
    description: "버크셔 해서웨이 보유 상위 종목",
    stocks: [
      { ticker: "AAPL", name: "Apple", description: "버크셔 최대 보유" },
      { ticker: "BAC", name: "Bank of America", description: "대형 은행" },
      { ticker: "AXP", name: "American Express", description: "결제·카드" },
      { ticker: "KO", name: "Coca-Cola", description: "장기 보유 대표" },
      { ticker: "CVX", name: "Chevron", description: "에너지" },
    ],
  },
  {
    id: "quality",
    name: "Quality",
    category: "팩터형",
    description: "ROE·재무 건전성이 높은 우량주",
    stocks: [
      { ticker: "MSFT", name: "Microsoft", description: "고ROE 빅테크" },
      { ticker: "V", name: "Visa", description: "글로벌 결제 네트워크" },
      { ticker: "MA", name: "Mastercard", description: "결제 네트워크" },
      { ticker: "UNH", name: "UnitedHealth", description: "미국 최대 헬스보험" },
      { ticker: "HD", name: "Home Depot", description: "홈인테리어 대형" },
    ],
  },
];

export function getBundleById(id: string): Bundle | undefined {
  return BUNDLES.find((b) => b.id === id);
}
