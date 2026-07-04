"use client";

import type { Briefing } from "@/services/briefing/types";
import { ChartWithCaption } from "../ChartWithCaption";
import { InfoTooltip } from "@/components/common/InfoTooltip";

const LAYER_HINTS: Record<string, string> = {
  L0: "환전·결제 재원 — playbook 0단계와 연결",
  L1: "주식·ETF·채권·현금 비중 — 리스크 큰 그림",
  L2: "한국·미국·일본 — 지역 rotation",
  L3: "섹터 자금 흐름 — 크로스 섹터 유입·유출",
  L4: "실제 보유 티커 — 분할 매수·매도 단위",
};

export function AnalysisGuideSection({
  guide,
}: {
  guide: Briefing["sections"]["analysisGuide"];
}) {
  return (
    <ChartWithCaption
      title="분석·제안 계층 (L0→L4)"
      caption={guide.intro}
      interpretation={[
        "위에서 아래로 내려가며 현금 → 섹터 → 종목 순으로 조정안을 해석합니다.",
        "각 계층 insight는 당일 playbook·추천과 같은 신호를 공유합니다.",
      ]}
    >
      <div className="space-y-4">
        {guide.layers.map((layer) => (
          <div key={layer.layer} className="rounded-md border p-3 text-sm">
            <div className="flex items-center gap-2 font-medium">
              {layer.layer} {layer.title}
              <InfoTooltip label={layer.layer} description={LAYER_HINTS[layer.layer] ?? layer.role} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{layer.role}</p>
            <table className="mt-2 w-full text-xs">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="text-left py-1">항목</th>
                  <th className="text-right">비중</th>
                </tr>
              </thead>
              <tbody>
                {layer.items.map((item) => (
                  <tr key={item.key}>
                    <td className="py-1">
                      {item.label}
                      {item.note ? (
                        <span className="text-muted-foreground"> · {item.note}</span>
                      ) : null}
                    </td>
                    <td className="text-right">{item.weightPct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-muted-foreground">{layer.insight}</p>
          </div>
        ))}
      </div>
    </ChartWithCaption>
  );
}
