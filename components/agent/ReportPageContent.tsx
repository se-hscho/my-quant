"use client";

import type { Briefing } from "@/services/briefing/types";
import { getAnalystReports } from "@/services/analyst/adapter";
import { ReportLayout } from "./ReportLayout";
import { PortfolioSnapshotSection } from "./sections/PortfolioSnapshotSection";
import { FxSection } from "./sections/FxSection";
import { SmartMoneySection } from "./sections/SmartMoneySection";
import { SectorFlowsSection } from "./sections/SectorFlowsSection";
import { ContextSection } from "./sections/ContextSection";
import { EventsSection } from "./sections/EventsSection";
import { InstitutionalLensSection } from "./sections/InstitutionalLensSection";
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
  const reports = getAnalystReports(tickers);
  const reported = new Set(reports.map((r) => r.ticker.toUpperCase()));
  const missingTickers = tickers.filter((t) => !reported.has(t.toUpperCase()));

  return (
    <ReportLayout date={briefing.date} disclaimer={briefing.disclaimer}>
      <PortfolioSnapshotSection section={briefing.sections.portfolio} />
      <FxSection fx={briefing.sections.fx} />
      <SmartMoneySection data={briefing.sections.smartMoney} />
      <InstitutionalLensSection paragraphs={briefing.sections.institutional.paragraphs} />
      <SectorFlowsSection section={briefing.sections.sectorFlows} />
      <ContextSection items={briefing.sections.context.items} />
      <AnalystSection reports={reports} missingTickers={missingTickers} />
      <EventsSection timeline={briefing.sections.events.timeline} />
      <RecommendationsSection rows={briefing.sections.recommendations.rows} />
      <ScenariosSection scenarios={briefing.scenarios} />
      <PlaybookSection scenarios={briefing.scenarios} />
      <ReturnBreakdownSection scenarios={briefing.scenarios} />
      {briefing.sections.diff ? (
        <DiffSection diff={briefing.sections.diff} />
      ) : null}
    </ReportLayout>
  );
}
