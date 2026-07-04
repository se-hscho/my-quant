"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createEmptySnapshot,
  loadHoldingsSnapshot,
} from "@/lib/agent/holdings-storage";
import { persistHoldingsWithSync } from "@/lib/agent/personal-sync";
import type { HoldingsSnapshot } from "@/types/agent";
import { HoldingsEditor } from "./HoldingsEditor";
import { HoldingsList } from "./HoldingsList";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { useAgentPersonal } from "./AgentPersonalProvider";
import { Skeleton } from "@/components/ui/skeleton";

export function HoldingsPageContent() {
  const router = useRouter();
  const { ready } = useAgentPersonal();
  const [draft, setDraft] = useState<HoldingsSnapshot>(createEmptySnapshot);
  const [saved, setSaved] = useState<HoldingsSnapshot>(createEmptySnapshot);

  useEffect(() => {
    if (!ready) return;
    const snap = loadHoldingsSnapshot() ?? createEmptySnapshot();
    setDraft(snap);
    setSaved(snap);
  }, [ready]);

  async function handleSave() {
    const stamped = { ...draft, updatedAt: new Date().toISOString() };
    await persistHoldingsWithSync(stamped);
    setSaved(stamped);
    router.push("/agent");
  }

  if (!ready) {
    return <Skeleton className="h-64 w-full" />;
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
