"use client";

import * as React from "react";
import { PlusIcon } from "lucide-react";
import type { Bundle } from "@/types";
import { BundleCard } from "./BundleCard";
import { Button } from "@/components/ui/button";
import { CreateBundleDialog } from "@/components/bundle/CreateBundleDialog";
import {
  loadCustomBundles,
  saveCustomBundle,
  deleteCustomBundle,
} from "@/lib/custom-bundles";

export function BundleGallery({ bundles }: { bundles: Bundle[] }) {
  const [customBundles, setCustomBundles] = React.useState<Bundle[]>([]);
  const [filter, setFilter] = React.useState<string>("전체");
  const [dialogOpen, setDialogOpen] = React.useState(false);

  React.useEffect(() => {
    setCustomBundles(loadCustomBundles());
  }, []);

  const allBundles = React.useMemo(
    () => [...bundles, ...customBundles],
    [bundles, customBundles]
  );

  const categories = React.useMemo(
    () => [...new Set(allBundles.map((b) => b.category))],
    [allBundles]
  );

  const visible = React.useMemo(
    () =>
      filter === "전체" ? allBundles : allBundles.filter((b) => b.category === filter),
    [filter, allBundles]
  );

  const handleSave = (bundle: Bundle) => {
    saveCustomBundle(bundle);
    setCustomBundles(loadCustomBundles());
  };

  const handleDelete = (id: string) => {
    deleteCustomBundle(id);
    const next = loadCustomBundles();
    setCustomBundles(next);
    const updatedCategories = [...new Set([...bundles, ...next].map((b) => b.category))];
    if (!updatedCategories.includes(filter)) setFilter("전체");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="카테고리 필터">
        <Button
          variant={filter === "전체" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("전체")}
        >
          전체
        </Button>
        {categories.map((c) => (
          <Button
            key={c}
            variant={filter === c ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(c)}
          >
            {c}
          </Button>
        ))}
        <Button
          size="sm"
          variant="outline"
          className="ml-auto gap-1"
          onClick={() => setDialogOpen(true)}
        >
          <PlusIcon className="h-4 w-4" />
          번들 추가하기
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((b) => (
          <BundleCard
            key={b.id}
            bundle={b}
            onDelete={b.isCustom ? () => handleDelete(b.id) : undefined}
          />
        ))}
      </div>

      <CreateBundleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
      />
    </div>
  );
}
