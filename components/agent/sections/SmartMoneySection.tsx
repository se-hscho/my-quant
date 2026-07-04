"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Briefing } from "@/services/briefing/types";
import { ChartWithCaption } from "../ChartWithCaption";

export function SmartMoneySection({
  data,
}: {
  data: Briefing["sections"]["smartMoney"];
}) {
  const chartData = [
    { name: "외국인", value: data.foreignNetBuyBn },
    { name: "기관", value: data.institutionNetBuyBn },
  ];

  const sourceLabel =
    data.source === "naver-live"
      ? `Naver ${data.asOfDate ?? "최근"}`
      : data.source === "krx-live"
        ? `KRX ${data.asOfDate ?? "최근"}`
        : "참고 샘플";

  const caption = `외국인 ${data.foreignNetBuyBn >= 0 ? "+" : ""}${data.foreignNetBuyBn.toFixed(2)}조 · 기관 ${data.institutionNetBuyBn >= 0 ? "+" : ""}${data.institutionNetBuyBn.toFixed(2)}조 (${sourceLabel})`;

  return (
    <ChartWithCaption
      title="스마트 머니 — 외국인·기관 수급"
      caption={caption}
      help={[
        "외국인·기관 수급은 섹터 로테이션 배경 지표입니다.",
        "지연 공시(13F 등)와 결합해 방향만 읽고 개인 규모로 번역하세요.",
      ]}
    >
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="hsl(var(--chart-2))" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartWithCaption>
  );
}
