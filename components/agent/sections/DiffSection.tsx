"use client";

import type { Briefing } from "@/services/briefing/types";
import { ChartWithCaption } from "../ChartWithCaption";

export function DiffSection({ diff }: { diff: NonNullable<Briefing["sections"]["diff"]> }) {
  const caption =
    diff.rows.length === 0
      ? "전일 대비 변경 없음"
      : diff.rows.map((r) => `${r.field} ${r.before}→${r.after}`).join(" · ");

  return (
    <ChartWithCaption
      title="전일 대비 변경"
      caption={caption}
      help={[
        "시나리오·수익률·제안 변경을 전일 브리핑과 비교합니다.",
        ...(diff.reason.length > 0 ? diff.reason : []),
      ]}
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
