"use client";

import type { Briefing } from "@/services/briefing/types";
import { ChartWithCaption } from "../ChartWithCaption";

export function PortfolioSnapshotSection({
  section,
}: {
  section: Briefing["sections"]["portfolio"];
}) {
  const rows = [
    ["1일", `${section.returns.d1}%`],
    ["7일", `${section.returns.d7}%`],
    ["1개월", `${section.returns.m1}%`],
    ["분기", `${section.returns.q1}%`],
    ["YTD", `${section.returns.ytd}%`],
  ];

  if (section.holdingsReturnPct != null) {
    rows.unshift([
      "보유(매수가 기준)",
      `${section.holdingsReturnPct >= 0 ? "+" : ""}${section.holdingsReturnPct.toFixed(1)}%${
        section.holdingsPnlKrw != null
          ? ` (${Math.round(section.holdingsPnlKrw).toLocaleString("ko-KR")}원)`
          : ""
      }`,
    ]);
  }

  return (
    <ChartWithCaption
      title="포트폴리오 스냅샷"
      caption={section.caption}
      help={section.help}
    >
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2 pr-2">기간</th>
            <th className="py-2">수익률 (참고용)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([period, ret]) => (
            <tr key={period} className="border-b last:border-0">
              <td className="py-2 pr-2">{period}</td>
              <td className="py-2">{ret}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ChartWithCaption>
  );
}
