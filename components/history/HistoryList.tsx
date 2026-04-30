"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { PortfolioResult } from "@/types";

const METHOD_LABEL: Record<string, string> = {
  "max-sharpe": "Max Sharpe",
  "min-variance": "Min Variance",
  "risk-parity": "Risk Parity",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" });
}

export interface HistoryListProps {
  results: PortfolioResult[];
  selected: string[];
  onToggle: (id: string) => void;
  canCompare: boolean;
}

export function HistoryList({
  results,
  selected,
  onToggle,
  canCompare,
}: HistoryListProps) {
  const router = useRouter();

  if (results.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        저장된 결과가 없습니다. 결과 화면에서 &quot;결과 저장&quot;을 눌러보세요.
      </p>
    );
  }

  const handleCompare = () => {
    if (selected.length !== 2) return;
    const [a, b] = selected;
    router.push(`/compare?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          비교할 결과를 2개까지 선택할 수 있습니다 ({selected.length}/2 선택됨)
        </p>
        <Button onClick={handleCompare} disabled={!canCompare}>
          비교하기
        </Button>
      </div>
      <ul className="flex flex-col gap-2">
        {results.map((r) => {
          const isSelected = selected.includes(r.id);
          return (
            <li key={r.id}>
              <Card data-testid={`history-${r.id}`} size="sm">
                <CardContent className="flex items-center gap-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggle(r.id)}
                    aria-label={`${r.bundleName} 선택`}
                  />
                  <Link
                    href={`/results/${r.id}`}
                    className="flex-1 hover:underline"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{r.bundleName}</span>
                      <Badge variant="secondary">
                        {METHOD_LABEL[r.method] ?? r.method}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(r.savedAt)}
                    </div>
                  </Link>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
