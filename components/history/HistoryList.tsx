"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  onDelete?: (id: string) => void;
  canCompare: boolean;
}

export function HistoryList({
  results,
  selected,
  onToggle,
  onDelete,
  canCompare,
}: HistoryListProps) {
  const router = useRouter();
  const [pendingDelete, setPendingDelete] =
    React.useState<PortfolioResult | null>(null);

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

  const handleConfirmDelete = () => {
    if (!pendingDelete || !onDelete) return;
    onDelete(pendingDelete.id);
    setPendingDelete(null);
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
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`${r.bundleName} 삭제`}
                      onClick={() => setPendingDelete(r)}
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>기록을 삭제하시겠어요?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `"${pendingDelete.bundleName}" 결과가 영구 삭제됩니다. 이 작업은 되돌릴 수 없습니다.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmDelete}>
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
