import { describe, it, expect } from "vitest";
import { parseKoreanAmount } from "./korean-amount";

describe("parseKoreanAmount", () => {
  it("5000만 → 50_000_000", () => {
    expect(parseKoreanAmount("5000만")).toBe(50_000_000);
  });

  it("오만원 → 50_000", () => {
    expect(parseKoreanAmount("오만원")).toBe(50_000);
  });

  it("오만 → 50_000", () => {
    expect(parseKoreanAmount("오만")).toBe(50_000);
  });
});
