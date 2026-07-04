import { vi } from "vitest";

vi.mock("@/services/smart-money/krx-live", () => ({
  fetchKrxInvestorFlow: vi.fn(async () => null),
}));

vi.mock("@/services/analyst/kr-wisereport", () => ({
  fetchKrWisereportReports: vi.fn(async () => []),
}));

vi.mock("@/services/analyst/finnhub", () => ({
  fetchFinnhubRecommendations: vi.fn(async () => []),
}));
