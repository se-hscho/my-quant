"use client";

import type { Briefing } from "@/services/briefing/types";
import { ChartWithCaption } from "../ChartWithCaption";

export function DiffSection({ diff }: { diff: NonNullable<Briefing["sections"]["diff"]> }) {
  return (
    <ChartWithCaption
      title="전일 대비 변경"
      caption="제안·시점 diff"
      interpretation={diff.reason}
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2">항목</th>
            <th className="py-2">전일</th>
            <th className="py-2">오늘</th>
          </tr>
        </thead>
        <tbody>
          {diff.rows.map((r) => (
            <tr key={r.field} className="border-b">
              <td className="py-2">{r.field}</td>
              <td className="py-2">{r.before}</td>
              <td
                className={
                  r.direction === "up"
                    ? "py-2 text-emerald-600"
                    : r.direction === "down"
                      ? "py-2 text-red-600"
                      : "py-2"
                }
              >
                {r.after}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ChartWithCaption>
  );
}
