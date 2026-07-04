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

  const caption =
    data.source === "naver-live"
      ? `Naver KOSPI 순매수 — ${data.asOfDate ?? "최근 영업일"} (조원, 공개)`
      : data.source === "krx-live"
        ? `KRX 투자자별 거래대금 — ${data.asOfDate ?? "최근 영업일"} (조원, live)`
        : "순매수 규모 (조원, 참고용 샘플 데이터)";

  return (
    <ChartWithCaption
      title="스마트 머니 — 외국인·기관 수급"
      caption={caption}
      interpretation={[
        "외국인·기관 수급 방향은 섹터 로테이션의 배경 지표로 활용합니다.",
        "지연 공시(13F 등)와 결합해 방향만 읽고 개인 실행 규모로 번역하세요.",
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
