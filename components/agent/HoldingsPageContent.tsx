"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createEmptySnapshot,
  loadHoldingsSnapshot,
  persistHoldingsSnapshot,
} from "@/lib/agent/holdings-storage";
import type { HoldingsSnapshot } from "@/types/agent";
import { HoldingsEditor } from "./HoldingsEditor";
import { HoldingsList } from "./HoldingsList";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";

function initialDraft(): HoldingsSnapshot {
  return loadHoldingsSnapshot() ?? createEmptySnapshot();
}

export function HoldingsPageContent() {
  const router = useRouter();
  const [draft, setDraft] = useState<HoldingsSnapshot>(initialDraft);
  const [saved, setSaved] = useState<HoldingsSnapshot>(initialDraft);

  function handleSave() {
    if (!persistHoldingsSnapshot(draft)) return;
    setSaved({ ...draft, updatedAt: new Date().toISOString() });
    router.push("/agent");
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/agent" aria-label="에이전트로 돌아가기">
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-sm font-semibold flex-1 text-center">보유 자산 편집</h2>
        <Button size="sm" onClick={handleSave}>
          저장
        </Button>
      </div>

      <HoldingsEditor draft={draft} onDraftChange={setDraft} />
      <HoldingsList snapshot={saved} />
    </div>
  );
}
