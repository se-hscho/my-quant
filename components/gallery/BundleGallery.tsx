"use client";

import * as React from "react";
import type { Bundle, BundleCategory } from "@/types";
import { BundleCard } from "./BundleCard";
import { Button } from "@/components/ui/button";

const CATEGORIES: BundleCategory[] = [
  "테마형",
  "팩터형",
  "전통 배분",
  "기관 따라하기",
];

export function BundleGallery({ bundles }: { bundles: Bundle[] }) {
  const [filter, setFilter] = React.useState<BundleCategory | "전체">("전체");

  const visible = React.useMemo(
    () =>
      filter === "전체"
        ? bundles
        : bundles.filter((b) => b.category === filter),
    [filter, bundles]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="카테고리 필터">
        <Button
          variant={filter === "전체" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("전체")}
        >
          전체
        </Button>
        {CATEGORIES.map((c) => (
          <Button
            key={c}
            variant={filter === c ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(c)}
          >
            {c}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((b) => (
          <BundleCard key={b.id} bundle={b} />
        ))}
      </div>
    </div>
  );
}
