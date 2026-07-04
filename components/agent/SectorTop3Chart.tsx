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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SectorTop3Chart({
  sectors,
}: {
  sectors: Briefing["sectorTop3"];
}) {
  const data = sectors.map((s) => ({
    name: s.label,
    flow: Math.round(s.flowScore * 100),
    weight: s.weightPct,
  }));

  return (
    <Card data-testid="sector-top3-chart">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">섹터 자금 흐름 상위 3</CardTitle>
      </CardHeader>
      <CardContent className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" fontSize={12} />
            <YAxis type="category" dataKey="name" width={72} fontSize={11} />
            <Tooltip />
            <Bar dataKey="flow" name="수급 점수" fill="hsl(var(--chart-3))" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
