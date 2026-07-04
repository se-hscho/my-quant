"use client";

import type { ReportTocItem } from "@/lib/agent/report-outline";

export function ReportTableOfContents({ items }: { items: ReportTocItem[] }) {
  return (
    <nav
      aria-label="레포트 목차"
      className="rounded-md border bg-muted/30 p-4"
      data-testid="report-toc"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        목차
      </p>
      <ol className="space-y-2 text-sm">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="flex gap-2 hover:text-primary hover:underline"
            >
              <span className="w-6 shrink-0 font-medium text-muted-foreground">
                {item.chapter}.
              </span>
              <span>{item.title}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
