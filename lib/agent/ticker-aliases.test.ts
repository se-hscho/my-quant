import { describe, expect, it } from "vitest";
import { normalizeNaturalLanguageCommand } from "./ticker-aliases";

describe("normalizeNaturalLanguageCommand", () => {
  it("반도체 etf 구매 표현을 SOXX 등록 명령으로 바꾼다", () => {
    expect(normalizeNaturalLanguageCommand("반도체 etf 10주 샀어")).toBe(
      "SOXX 10주 등록"
    );
  });

  it("필라델피아 반도체 표현을 SOXX로 바꾼다", () => {
    expect(
      normalizeNaturalLanguageCommand("필라델피아 반도체 etf 10주 샀어")
    ).toBe("SOXX 10주 등록");
  });

  it("삼전 별칭을 티커로 바꾼다", () => {
    expect(normalizeNaturalLanguageCommand("삼전 10주")).toBe(
      "005930.KS 10주 등록"
    );
  });
});
