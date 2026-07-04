import { describe, it, expect } from "vitest";
import {
  normalizeImportedTicker,
  parseHoldingsImportFromLlm,
} from "@/lib/agent/holdings-import-parse";
import {
  mergeImportedHoldingsIntoSnapshot,
  importedDraftToHolding,
} from "@/lib/agent/holdings-import-merge";
import { createEmptySnapshot } from "@/lib/agent/holdings-storage";

describe("normalizeImportedTicker", () => {
  it("6자리 한국 코드를 .KS로 변환한다", () => {
    expect(normalizeImportedTicker("005930")).toBe("005930.KS");
    expect(normalizeImportedTicker("005930.KR")).toBe("005930.KS");
  });

  it("미국 티커는 대문자로 유지한다", () => {
    expect(normalizeImportedTicker("soxx")).toBe("SOXX");
  });
});

describe("parseHoldingsImportFromLlm", () => {
  it("유효한 holdings 배열을 파싱한다", () => {
    const result = parseHoldingsImportFromLlm({
      holdings: [
        {
          ticker: "005930",
          name: "삼성전자",
          quantity: 10,
          avgCost: 72000,
          assetType: "stock",
          currency: "KRW",
        },
        {
          symbol: "SOXX",
          qty: 5,
          purchasePrice: 245,
          assetType: "etf",
          currency: "USD",
        },
      ],
      cash: { krw: 1000000 },
      confidence: "high",
    });

    expect(result?.holdings).toHaveLength(2);
    expect(result?.holdings[0].ticker).toBe("005930.KS");
    expect(result?.holdings[1].ticker).toBe("SOXX");
    expect(result?.cash?.krw).toBe(1000000);
  });

  it("종목이 없으면 null", () => {
    expect(parseHoldingsImportFromLlm({ holdings: [] })).toBeNull();
    expect(parseHoldingsImportFromLlm({ foo: "bar" })).toBeNull();
  });
});

describe("mergeImportedHoldingsIntoSnapshot", () => {
  it("동일 티커는 교체하고 섹터 미분류 목록을 반환한다", () => {
    const draft = createEmptySnapshot();
    draft.holdings.push(importedDraftToHolding({
      ticker: "SOXX",
      quantity: 3,
      avgCost: 200,
      assetType: "etf",
      currency: "USD",
    }));

    const { snapshot, needsSectorTag } = mergeImportedHoldingsIntoSnapshot(
      draft,
      [
        {
          ticker: "SOXX",
          quantity: 10,
          avgCost: 245,
          assetType: "etf",
          currency: "USD",
        },
        {
          ticker: "MYSTERY",
          quantity: 2,
          avgCost: 100,
          assetType: "stock",
          currency: "USD",
        },
      ],
      { krw: 5000000 }
    );

    expect(snapshot.holdings).toHaveLength(2);
    expect(snapshot.holdings.find((h) => h.ticker === "SOXX")?.quantity).toBe(10);
    expect(snapshot.cash.krw).toBe(5000000);
    expect(needsSectorTag).toHaveLength(1);
    expect(needsSectorTag[0].ticker).toBe("MYSTERY");
  });
});
