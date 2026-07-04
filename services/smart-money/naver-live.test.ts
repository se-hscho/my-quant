import { describe, expect, it } from "vitest";
import { parseNaverFlowBn } from "./naver-live";

describe("parseNaverFlowBn", () => {
  it("억원 문자열을 조원으로 변환", () => {
    expect(parseNaverFlowBn("-21,750")).toBe(-2.17);
    expect(parseNaverFlowBn("+44,079")).toBe(4.41);
    expect(parseNaverFlowBn("0")).toBe(0);
  });
});
