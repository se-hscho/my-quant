"use client";

import { useEffect, useState } from "react";
import type { ImportedHoldingDraft, HoldingsImportResult } from "@/types/holdings-import";
import {
  ASSET_TYPE_LABELS,
  CURRENCY_LABELS,
  formatPrice,
} from "@/lib/agent/holdings-display";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface HoldingsImportPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: HoldingsImportResult;
  thumbnailUrl: string | null;
  onConfirm: (selected: ImportedHoldingDraft[], cash?: HoldingsImportResult["cash"]) => void;
}

export function HoldingsImportPreviewDialog({
  open,
  onOpenChange,
  result,
  thumbnailUrl,
  onConfirm,
}: HoldingsImportPreviewDialogProps) {
  const [selected, setSelected] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    if (open) {
      setSelected(new Set(result.holdings.map((_, i) => i)));
    }
  }, [open, result.holdings]);

  function toggleIndex(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function handleConfirm() {
    const items = result.holdings.filter((_, i) => selected.has(i));
    if (items.length === 0) return;
    onConfirm(items, result.cash);
  }

  const cashParts: string[] = [];
  if (result.cash?.krw) cashParts.push(`KRW ${result.cash.krw.toLocaleString()}`);
  if (result.cash?.usd) cashParts.push(`USD ${result.cash.usd}`);
  if (result.cash?.jpy) cashParts.push(`JPY ${result.cash.jpy.toLocaleString()}`);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>스크린샷에서 추출한 보유</DialogTitle>
          <DialogDescription>
            등록할 종목을 확인하세요. 티커·수량·매수가는 수동으로도 수정할 수 있습니다.
            {result.confidence === "low" ? " (인식 신뢰도 낮음 — 값을 꼭 확인하세요.)" : null}
          </DialogDescription>
        </DialogHeader>

        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt="업로드한 보유 화면 캡처"
            className="max-h-32 w-full rounded-md border object-contain bg-muted/30"
          />
        ) : null}

        {result.notes ? (
          <p className="text-xs text-amber-600 dark:text-amber-400">{result.notes}</p>
        ) : null}

        <ul className="space-y-2 text-sm">
          {result.holdings.map((h, index) => (
            <li key={`${h.ticker}-${index}`} className="flex items-start gap-2 rounded-md border p-2">
              <input
                type="checkbox"
                id={`import-row-${index}`}
                checked={selected.has(index)}
                onChange={() => toggleIndex(index)}
                className="mt-1"
                aria-label={`${h.ticker} 등록`}
              />
              <label htmlFor={`import-row-${index}`} className="flex-1 cursor-pointer space-y-0.5">
                <div className="font-medium">
                  {h.ticker}
                  {h.name ? ` · ${h.name}` : ""}
                </div>
                <div className="text-muted-foreground">
                  {h.quantity}주 ·{" "}
                  {h.avgCost != null
                    ? `${formatPrice(h.currency, h.avgCost)} 매수 · `
                    : "매수가 미인식 · "}
                  {ASSET_TYPE_LABELS[h.assetType]} · {CURRENCY_LABELS[h.currency]}
                </div>
              </label>
            </li>
          ))}
        </ul>

        {cashParts.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            현금 잔고도 반영: {cashParts.join(" · ")}
          </p>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button type="button" disabled={selected.size === 0} onClick={handleConfirm}>
            {selected.size}개 종목 등록
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
