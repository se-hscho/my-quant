"use client";

import { useHistory } from "@/hooks/useHistory";
import { HistoryList } from "@/components/history/HistoryList";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

export function HistoryPageClient() {
  const { results, selected, toggle, remove, canCompare } = useHistory();
  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6 flex items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/">
            <ArrowLeftIcon className="h-4 w-4" data-icon="inline-start" />
            홈으로
          </Link>
        </Button>
        <h1 className="text-xl font-bold">기록</h1>
      </header>
      <HistoryList
        results={results}
        selected={selected}
        onToggle={toggle}
        onDelete={remove}
        canCompare={canCompare}
      />
    </main>
  );
}
