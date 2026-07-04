"use client";

import type { Briefing } from "@/services/briefing/types";
import {
  buildReportExecutiveSummary,
  buildReportToc,
  REPORT_CHAPTERS,
} from "@/lib/agent/report-outline";
import { ReportLayout } from "./ReportLayout";
import { ReportHeader } from "./report/ReportHeader";
import { ReportTableOfContents } from "./report/ReportTableOfContents";
import { ReportChapter } from "./report/ReportChapter";
import { ExecutiveSummarySection } from "./report/ExecutiveSummarySection";
import { ScenarioOverviewTable } from "./report/ScenarioOverviewTable";
import { PortfolioWeightsSection } from "./sections/PortfolioWeightsSection";
import { PortfolioSnapshotSection } from "./sections/PortfolioSnapshotSection";
import { FxSection } from "./sections/FxSection";
import { SmartMoneySection } from "./sections/SmartMoneySection";
import { SectorFlowsSection } from "./sections/SectorFlowsSection";
import { ContextSection } from "./sections/ContextSection";
import { EventsSection } from "./sections/EventsSection";
import { InstitutionalLensSection } from "./sections/InstitutionalLensSection";
import { InvestmentDirectionSection } from "./sections/InvestmentDirectionSection";
import { AnalysisGuideSection } from "./sections/AnalysisGuideSection";
import { RecommendationsSection } from "./sections/RecommendationsSection";
import { ScenariosSection } from "./sections/ScenariosSection";
import { PlaybookSection } from "./sections/PlaybookSection";
import { ReturnBreakdownSection } from "./sections/ReturnBreakdownSection";
import { AnalystSection } from "./sections/AnalystSection";
import { DiffSection } from "./sections/DiffSection";

export function ReportPageContent({ briefing }: { briefing: Briefing }) {
  const tickers = Object.keys(briefing.scenarios[0]?.weightsBefore ?? {}).filter(
    (t) => t !== "CASH"
  );
  const reports = briefing.sections.analyst?.reports ?? [];
  const reported = new Set(reports.map((r) => r.ticker.toUpperCase()));
  const missingTickers = tickers.filter((t) => !reported.has(t.toUpperCase()));

  const deploymentMode = briefing.sections.investmentDirection?.mode === "deployment";
  const hasDiff = Boolean(briefing.sections.diff);
  const executiveSummary = buildReportExecutiveSummary(briefing);
  const toc = buildReportToc(hasDiff, deploymentMode);

  return (
    <ReportLayout disclaimer={briefing.disclaimer}>
      <ReportHeader briefing={briefing} />
      <ReportTableOfContents items={toc} />

      <ReportChapter
        id={REPORT_CHAPTERS.summary.id}
        chapter={REPORT_CHAPTERS.summary.chapter}
        title={REPORT_CHAPTERS.summary.title}
        subtitle="당일 핵심 결론·지표·우선 검토 사항"
      >
        <ExecutiveSummarySection summary={executiveSummary} />
      </ReportChapter>

      <ReportChapter
        id={REPORT_CHAPTERS.portfolio.id}
        chapter={REPORT_CHAPTERS.portfolio.chapter}
        title={REPORT_CHAPTERS.portfolio.title}
        subtitle="수익률·비중·L0~L4 계층별 포지션"
      >
        <PortfolioSnapshotSection section={briefing.sections.portfolio} />
        <PortfolioWeightsSection
          scenarios={briefing.scenarios}
          totalAssetsKrw={briefing.totalAssetsKrw}
        />
        <AnalysisGuideSection guide={briefing.sections.analysisGuide} />
      </ReportChapter>

      <ReportChapter
        id={REPORT_CHAPTERS.market.id}
        chapter={REPORT_CHAPTERS.market.chapter}
        title={REPORT_CHAPTERS.market.title}
        subtitle="수급·환율·정책·이벤트·기관 vs 개인"
      >
        <SmartMoneySection data={briefing.sections.smartMoney} />
        <FxSection fx={briefing.sections.fx} />
        <ContextSection items={briefing.sections.context.items} />
        <EventsSection timeline={briefing.sections.events.timeline} />
        <InstitutionalLensSection paragraphs={briefing.sections.institutional.paragraphs} />
      </ReportChapter>

      <ReportChapter
        id={REPORT_CHAPTERS.sector.id}
        chapter={REPORT_CHAPTERS.sector.chapter}
        title={REPORT_CHAPTERS.sector.title}
        subtitle="전 섹터 자금 흐름·상대강도"
      >
        <SectorFlowsSection section={briefing.sections.sectorFlows} />
      </ReportChapter>

      <ReportChapter
        id={REPORT_CHAPTERS.strategy.id}
        chapter={REPORT_CHAPTERS.strategy.chapter}
        title={deploymentMode ? "신규 배분 전략" : REPORT_CHAPTERS.strategy.title}
        subtitle={
          deploymentMode
            ? "현금 100% → 목표 비중·종목 조합·분할 일정"
            : "L3·L4 신호 기반 검토안 · 증권사 리서치"
        }
      >
        {briefing.sections.investmentDirection ? (
          <InvestmentDirectionSection section={briefing.sections.investmentDirection} />
        ) : null}
        <RecommendationsSection rows={briefing.sections.recommendations.rows} />
        <AnalystSection reports={reports} missingTickers={missingTickers} />
      </ReportChapter>

      <ReportChapter
        id={REPORT_CHAPTERS.scenario.id}
        chapter={REPORT_CHAPTERS.scenario.chapter}
        title={REPORT_CHAPTERS.scenario.title}
        subtitle="Follow·선점·최소변경 비교 — Before/After · 수익 분해"
      >
        <ScenarioOverviewTable scenarios={briefing.scenarios} />
        <ScenariosSection scenarios={briefing.scenarios} />
        <ReturnBreakdownSection scenarios={briefing.scenarios} />
      </ReportChapter>

      <ReportChapter
        id={REPORT_CHAPTERS.execution.id}
        chapter={REPORT_CHAPTERS.execution.chapter}
        title={REPORT_CHAPTERS.execution.title}
        subtitle="환전 → 매도 → 분할 매수 실행 순서"
      >
        <PlaybookSection scenarios={briefing.scenarios} />
      </ReportChapter>

      {briefing.sections.diff ? (
        <ReportChapter
          id={REPORT_CHAPTERS.changes.id}
          chapter={REPORT_CHAPTERS.changes.chapter}
          title={REPORT_CHAPTERS.changes.title}
          subtitle="전일 브리핑 대비 변경 항목"
        >
          <DiffSection diff={briefing.sections.diff} />
        </ReportChapter>
      ) : null}
    </ReportLayout>
  );
}
