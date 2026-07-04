import type { ReactNode } from "react";
import { InfoTooltip } from "@/components/common/InfoTooltip";

export function ChartWithCaption({
  title,
  caption,
  help,
  nested = false,
  children,
}: {
  title: string;
  /** 당일 분석 결과 한 줄 요약 */
  caption: string;
  /** 영역별 도움말 — 툴팁에만 표시 */
  help?: string[];
  nested?: boolean;
  children: ReactNode;
}) {
  const TitleTag = nested ? "h4" : "h3";
  return (
    <section
      className={nested ? "space-y-2 pl-0 border-l-0" : "space-y-2"}
      data-testid="chart-with-caption"
    >
      <div className="flex items-start gap-2">
        <TitleTag className={`font-semibold flex-1 ${nested ? "text-sm" : "text-sm"}`}>
          {title}
        </TitleTag>
        {help && help.length > 0 ? (
          <InfoTooltip label={`${title} 도움말`} description={help} />
        ) : null}
      </div>
      <p className="text-sm text-foreground">{caption}</p>
      {children}
    </section>
  );
}
