"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { DisclaimerFooter } from "./DisclaimerFooter";

export function ReportLayout({
  date,
  children,
  disclaimer,
}: {
  date: string;
  children: ReactNode;
  disclaimer: string;
}) {
  return (
    <div className="space-y-8" data-testid="report-layout">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{date} 상세 레포트</h2>
        <Link href="/agent" className="text-sm text-muted-foreground hover:underline">
          ← 요약으로
        </Link>
      </div>
      {children}
      <DisclaimerFooter text={disclaimer} />
    </div>
  );
}
