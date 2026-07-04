"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { hasRegisteredHoldings } from "@/lib/agent/holdings-storage";
import type { Briefing } from "@/services/briefing/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BriefingHistoryList() {
  const [dates, setDates] = useState<string[]>([]);
  const [selected, setSelected] = useState<Briefing | null>(null);

  useEffect(() => {
    void fetch("/api/agent/briefing")
      .then((r) => r.json())
      .then((d: { dates: string[] }) => setDates(d.dates ?? []));
  }, []);

  async function loadDate(date: string) {
    const res = await fetch(`/api/agent/briefing/${date}`);
    if (res.ok) {
      setSelected((await res.json()) as Briefing);
    }
  }

  return (
    <div className="space-y-4" data-testid="briefing-history">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">브리핑 히스토리</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {dates.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                아직 저장된 브리핑이 없습니다. 에이전트 홈에서 오늘 브리핑을 생성한 뒤 이곳에서
                날짜별로 다시 볼 수 있습니다.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/agent">오늘 브리핑 보러 가기</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-1">
              {dates.map((d) => (
                <li key={d}>
                  <Button variant="ghost" size="sm" onClick={() => void loadDate(d)}>
                    {d}
                  </Button>
                  <Button variant="link" size="sm" asChild>
                    <Link href={`/agent/report/${d}${hasRegisteredHoldings() ? "" : "?demo=1"}`}>
                      상세
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      {selected ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{selected.date} 요약</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-4 text-sm space-y-1">
              {selected.summaryLines.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
