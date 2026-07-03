import type { ReactNode } from "react";

export function ChartWithCaption({
  title,
  caption,
  interpretation,
  children,
}: {
  title: string;
  caption: string;
  interpretation: string[];
  children: ReactNode;
}) {
  return (
    <section className="space-y-2" data-testid="chart-with-caption">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
      <p className="text-xs font-medium text-muted-foreground">{caption}</p>
      {interpretation.map((p) => (
        <p key={p} className="text-sm text-muted-foreground">
          {p}
        </p>
      ))}
    </section>
  );
}
