import type { ReactNode } from "react";

export function ReportChapter({
  id,
  chapter,
  title,
  subtitle,
  children,
}: {
  id: string;
  chapter: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6 border-t border-border/60 pt-8 first:border-t-0 first:pt-0">
      <header className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Chapter {chapter}
        </p>
        <h3 className="mt-1 text-lg font-semibold tracking-tight">{title}</h3>
        {subtitle ? (
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{subtitle}</p>
        ) : null}
      </header>
      <div className="space-y-6 [&_[data-testid=chart-with-caption]]:border-l-2 [&_[data-testid=chart-with-caption]]:border-muted [&_[data-testid=chart-with-caption]]:pl-4">
        {children}
      </div>
    </section>
  );
}
