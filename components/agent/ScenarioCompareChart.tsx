"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Briefing } from "@/services/briefing/types";
import { formatScenarioChartLabel, SCENARIO_DISPLAY } from "@/config/agent-scenarios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/common/InfoTooltip";

export function ScenarioCompareChart({
  scenarios,
}: {
  scenarios: Briefing["scenarioComparison"];
}) {
  const data = scenarios.map((s) => ({
    name: formatScenarioChartLabel(s.id),
    return: s.expectedReturn,
    vol: s.expectedVolatility,
  }));

  return (
    <Card data-testid="scenario-compare-chart">
      <CardHeader className="pb-2 flex-row items-center gap-2">
        <CardTitle className="text-base">시나리오 비교</CardTitle>
        <InfoTooltip
          label="시나리오 비교"
          description={[
            "Follow·선점·최소변경은 기관 수급을 개인 실행 규모로 번역한 시나리오입니다.",
            "예상 수익률·변동성은 참고용이며 보장되지 않습니다.",
          ]}
        />
      </CardHeader>
      <CardContent className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={11} />
            <YAxis fontSize={12} unit="%" />
            <Tooltip />
            <Bar dataKey="return" name="예상 수익률 %" fill="hsl(var(--chart-1))" />
            <Bar dataKey="vol" name="예상 변동성 %" fill="hsl(var(--chart-2))" />
          </BarChart>
        </ResponsiveContainer>
        <p className="mt-2 text-[10px] text-muted-foreground">
          {SCENARIO_DISPLAY[1].summary} · {SCENARIO_DISPLAY[2].summary} ·{" "}
          {SCENARIO_DISPLAY[3].summary}
        </p>
      </CardContent>
    </Card>
  );
}
