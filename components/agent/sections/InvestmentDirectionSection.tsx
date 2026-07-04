"use client";

import type { InvestmentDirectionSection } from "@/types/deployment";
import { ChartWithCaption } from "../ChartWithCaption";
import { InfoTooltip } from "@/components/common/InfoTooltip";

function EvidenceLinks({ links }: { links: InvestmentDirectionSection["evidenceLinks"] }) {
  if (links.length === 0) return null;
  return (
    <div className="mt-3 rounded-md bg-muted/50 p-3 text-xs">
      <p className="font-medium mb-2">근거 확인 링크 (공개 출처)</p>
      <ul className="space-y-1">
        {links.map((link) => (
          <li key={link.url}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-2 hover:underline"
            >
              [{link.type}] {link.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function InvestmentDirectionSection({
  section,
}: {
  section: InvestmentDirectionSection;
}) {
  return (
    <ChartWithCaption
      title="투자 방향 · 자산 배분 · 분할 매수"
      caption={section.headline}
      interpretation={[
        "시장·정책 맥락을 바탕으로 안 1~3별 구체 종목 조합을 제안합니다.",
        "분할 매수 일정·장기 보유·리밸런싱 조건을 함께 확인하세요.",
        "링크는 공개 출처이며, 직접 열어 사실 관계를 검증할 수 있습니다.",
      ]}
    >
      <div className="space-y-4 text-sm">
        <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
          <p className="font-medium">
            권장: 안 {section.recommendedScenarioId} {section.recommendedScenarioLabel}
            <InfoTooltip
              label="권장 안"
              description={section.recommendedReason}
            />
          </p>
          <p className="mt-1 text-muted-foreground">{section.recommendedReason}</p>
        </div>

        <div>
          <p className="font-medium mb-1">시장 방향</p>
          <ul className="list-disc pl-5 text-muted-foreground space-y-1">
            {section.marketNarrative.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-medium mb-1">정책·이벤트</p>
          <ul className="list-disc pl-5 text-muted-foreground space-y-1">
            {section.policyNarrative.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        {section.combinations.map((combo) => (
          <div key={combo.id} className="rounded-md border p-3">
            <p className="font-medium">
              안 {combo.scenarioId} — {combo.label}
            </p>
            <p className="text-muted-foreground mt-1">{combo.description}</p>
            <p className="text-xs text-muted-foreground mt-1">{combo.marketRationale}</p>

            <table className="mt-3 w-full text-xs">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="text-left py-1">종목</th>
                  <th className="text-right">비중</th>
                  <th className="text-right">금액(KRW)</th>
                  <th className="text-left pl-2">역할</th>
                </tr>
              </thead>
              <tbody>
                {combo.tickers.map((t) => (
                  <tr key={t.ticker}>
                    <td className="py-1 font-medium">{t.ticker}</td>
                    <td className="text-right">{t.weightPct}%</td>
                    <td className="text-right">{t.amountKrw.toLocaleString("ko-KR")}</td>
                    <td className="pl-2 text-muted-foreground">{t.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="mt-3 text-xs">
              <span className="font-medium">분할 매수:</span> {combo.splitBuy.method} ·{" "}
              {combo.splitBuy.note}
            </p>

            <div className="mt-3 text-xs space-y-1">
              <p>
                <span className="font-medium">점검 주기:</span> {combo.holdGuide.reviewHorizon}
              </p>
              <p>
                <span className="font-medium">보유 검토:</span> {combo.holdGuide.holdUntil}
              </p>
              <p className="font-medium">리밸런싱 권장 조건:</p>
              <ul className="list-disc pl-5 text-muted-foreground">
                {combo.holdGuide.rebalanceTriggers.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>

            <EvidenceLinks links={combo.evidenceLinks} />
          </div>
        ))}

        <EvidenceLinks links={section.evidenceLinks} />
      </div>
    </ChartWithCaption>
  );
}
