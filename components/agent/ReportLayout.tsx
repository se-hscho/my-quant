"use client";

import type { ReactNode } from "react";
import { DisclaimerFooter } from "./DisclaimerFooter";

/** 상세 레포트 본문 래퍼 — 헤더·목차는 ReportPageContent에서 구성 */
export function ReportLayout({
  children,
  disclaimer,
}: {
  children: ReactNode;
  disclaimer: string;
}) {
  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-8" data-testid="report-layout">
      {children}
      <DisclaimerFooter text={disclaimer} />
    </div>
  );
}
