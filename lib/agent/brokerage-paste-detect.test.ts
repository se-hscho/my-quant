import { describe, expect, it } from "vitest";
import { looksLikeBrokeragePaste } from "./brokerage-paste-detect";

const SAMPLE_PASTE = `키움증권
아메리칸 타워
6,346,704원
- 2,532,259원(-28.51%)

한두
CREDIT SUISSE HIGH YIEL...
2,691원
• 841원(-23.81%)

키움증권
TIGER 리츠부동산인프라
1,234,567원
+ 12,345원(+1.01%)`;

describe("looksLikeBrokeragePaste", () => {
  it("증권앱 보유 목록 붙여넣기를 감지한다", () => {
    expect(looksLikeBrokeragePaste(SAMPLE_PASTE)).toBe(true);
  });

  it("짧은 채팅 메시지는 붙여넣기로 보지 않는다", () => {
    expect(looksLikeBrokeragePaste("SOXX 10주 등록")).toBe(false);
    expect(looksLikeBrokeragePaste("삼전 10주")).toBe(false);
  });

  it("원화 평가액 줄이 충분하지 않으면 false", () => {
    expect(
      looksLikeBrokeragePaste(
        "키움증권\n아메리칸 타워\n6,346,704원\n- 2,532,259원(-28.51%)"
      )
    ).toBe(false);
  });
});
