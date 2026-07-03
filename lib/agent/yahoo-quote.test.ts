import { describe, expect, it } from "vitest";
import { toYahooSymbol } from "./yahoo-quote";

describe("toYahooSymbol", () => {
  it("6자리 숫자 티커에 .KS를 붙인다", () => {
    expect(toYahooSymbol("005930")).toBe("005930.KS");
    expect(toYahooSymbol("069500")).toBe("069500.KS");
  });

  it("이미 접미사가 있으면 그대로 둔다", () => {
    expect(toYahooSymbol("005930.KS")).toBe("005930.KS");
    expect(toYahooSymbol("SOXX")).toBe("SOXX");
  });
});
