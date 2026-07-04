"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Briefing } from "@/services/briefing/types";
import { ChartWithCaption } from "../ChartWithCaption";

export function SectorFlowsSection({
  section,
}: {
  section: Briefing["sections"]["sectorFlows"];
}) {
  const data = section.rows.slice(0, 8).map((r) => ({
    name: r.label,
    rs: r.relativeStrength7d,
  }));

  return (
    <ChartWithCaption
      title="전 섹터 자금 흐름"
      caption={`${section.inflowNote} ${section.outflowNote}`}
      help={[
        "7일 상대강도(RS) — 보유 여부와 무관한 시장 섹터 흐름입니다.",
        "유입·유출 섹터는 L3 분석·검토안에 반영됩니다.",
      ]}
    >
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={10} angle={-20} textAnchor="end" height={50} />
            <YAxis fontSize={12} />
            <Tooltip />
            <Bar dataKey="rs" name="7일 RS" fill="hsl(var(--chart-4))" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartWithCaption>
  );
}
