import { describe, expect, it } from "vitest";
import {
  formatScenarioChartLabel,
  formatScenarioHeading,
  formatScenarioReference,
} from "@/config/agent-scenarios";

describe("agent-scenarios display", () => {
  it("formatScenarioHeading은 풀네임 뒤에 (N안)을 붙인다", () => {
    expect(formatScenarioHeading(1)).toBe(
      "Follow — 기관·외국인 수급 방향 따라 점진 조정 (1안)"
    );
    expect(formatScenarioHeading(2)).toMatch(/선점.*\(2안\)/);
  });

  it("formatScenarioChartLabel은 짧은 차트 라벨", () => {
    expect(formatScenarioChartLabel(1)).toBe("Follow (1안)");
  });

  it("formatScenarioReference는 heading과 동일", () => {
    expect(formatScenarioReference(3)).toBe(formatScenarioHeading(3));
  });
});
