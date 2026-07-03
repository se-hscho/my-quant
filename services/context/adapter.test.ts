import { describe, expect, it } from "vitest";
import { getContextFixture } from "./adapter";

describe("getContextFixture", () => {
  it("정책·뉴스·공시 3건을 반환한다", () => {
    const items = getContextFixture();
    expect(items).toHaveLength(3);
    expect(items.map((i) => i.type).sort()).toEqual(["disclosure", "news", "policy"]);
  });

  it("각 항목에 title·impact가 있다", () => {
    for (const item of getContextFixture()) {
      expect(item.title.length).toBeGreaterThan(0);
      expect(item.impact.length).toBeGreaterThan(0);
      expect(item.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
