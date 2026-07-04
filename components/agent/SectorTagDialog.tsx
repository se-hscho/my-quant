"use client";

import { useEffect, useState } from "react";
import type { Region } from "@/types/agent";
import { AGENT_SECTORS, type AgentSectorId } from "@/config/agent";
import { inferRegionFromTicker } from "@/lib/agent/sector-classify";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const REGIONS: { value: Region; label: string }[] = [
  { value: "KR", label: "한국" },
  { value: "US", label: "미국" },
  { value: "JP", label: "일본" },
];

export interface SectorTagDialogProps {
  open: boolean;
  ticker: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: (sector: AgentSectorId, region?: Region) => void;
}

export function SectorTagDialog({
  open,
  ticker,
  onOpenChange,
  onConfirm,
}: SectorTagDialogProps) {
  const inferredRegion = inferRegionFromTicker(ticker);
  const needsRegion = inferredRegion === null;

  const [sector, setSector] = useState<AgentSectorId>(AGENT_SECTORS[0].id);
  const [region, setRegion] = useState<Region>("US");

  useEffect(() => {
    if (open) {
      setSector(AGENT_SECTORS[0].id);
      setRegion(inferredRegion ?? "US");
    }
  }, [open, inferredRegion]);

  function handleConfirm() {
    onConfirm(sector, inferredRegion ?? region);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>섹터 태그 지정</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{ticker}</span> 티커의
            섹터를 자동으로 분류하지 못했습니다. 브리핑에 반영할 섹터를
            선택해 주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sector-tag-select">섹터</Label>
            <select
              id="sector-tag-select"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              value={sector}
              onChange={(e) => setSector(e.target.value as AgentSectorId)}
            >
              {AGENT_SECTORS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {needsRegion ? (
            <div className="space-y-2">
              <Label htmlFor="region-tag-select">지역</Label>
              <select
                id="region-tag-select"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                value={region}
                onChange={(e) => setRegion(e.target.value as Region)}
              >
                {REGIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button type="button" onClick={handleConfirm}>
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
