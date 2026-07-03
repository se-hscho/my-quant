import { describe, expect, it } from "vitest";
import { getEventsFixture } from "./adapter";

describe("getEventsFixture", () => {
  it("전·당일·후 3단계 타임라인을 반환한다", () => {
    const timeline = getEventsFixture();
    expect(timeline).toHaveLength(3);
    expect(timeline.map((e) => e.phase)).toEqual(["before", "today", "after"]);
  });

  it("각 이벤트에 direction·rationale bullet이 있다", () => {
    for (const event of getEventsFixture()) {
      expect(event.title.length).toBeGreaterThan(0);
      expect(event.bullets.length).toBeGreaterThan(0);
      expect(event.bullets[0].direction.length).toBeGreaterThan(0);
      expect(event.bullets[0].rationale.length).toBeGreaterThan(0);
    }
  });
});
