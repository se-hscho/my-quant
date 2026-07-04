import { describe, expect, it } from "vitest";
import { classifyMomentumTrend, suggestWeightAction } from "./momentum-trend";

describe("classifyMomentumTrend", () => {
  it("급등을 분류한다", () => {
    const m = classifyMomentumTrend({ d1: 2, d7: 5, m1: 12 });
    expect(m.labelKo).toBe("급등");
  });

  it("조정을 분류한다", () => {
    const m = classifyMomentumTrend({ d1: -2, d7: 1, m1: 6 });
    expect(m.labelKo).toBe("조정");
  });

  it("하락을 분류한다", () => {
    const m = classifyMomentumTrend({ d1: -1, d7: -3, m1: -4 });
    expect(m.labelKo).toBe("하락");
  });
});

describe("suggestWeightAction", () => {
  it("고수익·과대 비중 힌트를 합친다", () => {
    const hint = suggestWeightAction({
      returnPct: 30,
      weightPct: 28,
      momentum: classifyMomentumTrend({ d1: 1, d7: 4, m1: 10 }),
    });
    expect(hint).toMatch(/차익실현/);
    expect(hint).toMatch(/과대/);
  });
});
