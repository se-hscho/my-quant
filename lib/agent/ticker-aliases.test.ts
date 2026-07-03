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

  it("이미 티커가 있으면 별칭을 덮어쓰지 않는다", () => {
    expect(normalizeNaturalLanguageCommand("QQQ 5주 샀어")).toBe("QQQ 5주 등록");
  });
});
