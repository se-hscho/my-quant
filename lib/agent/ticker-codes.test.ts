import { describe, expect, it } from "vitest";
import { toKrStockCode, isUsListedSymbol } from "./ticker-codes";

describe("toKrStockCode", () => {
  it("6자리 및 .KS 심볼을 코드로 변환", () => {
    expect(toKrStockCode("005930.KS")).toBe("005930");
    expect(toKrStockCode("005930")).toBe("005930");
    expect(toKrStockCode("SOXX")).toBeNull();
  });
});

describe("isUsListedSymbol", () => {
  it("미국 심볼과 한국 심볼을 구분", () => {
    expect(isUsListedSymbol("SOXX")).toBe(true);
    expect(isUsListedSymbol("005930.KS")).toBe(false);
    expect(isUsListedSymbol("005930")).toBe(false);
  });
});
