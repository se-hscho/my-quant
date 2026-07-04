"use client";

import { useState } from "react";
import type { AssetType, Currency, Holding, HoldingsSnapshot } from "@/types/agent";
import {
  ASSET_TYPE_LABELS,
  CURRENCY_LABELS,
  formatCashAmount,
  formatPrice,
  formatQuantity,
  formatReturnPct,
  parseNumericInput,
} from "@/lib/agent/holdings-display";
import {
  applySectorTag,
  classifyTicker,
  type TickerClassification,
} from "@/lib/agent/sector-classify";
import type { AgentSectorId } from "@/config/agent";
import type { Region } from "@/types/agent";
import { SectorTagDialog } from "./SectorTagDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field, FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
import { PlusIcon, Trash2Icon } from "lucide-react";

export interface HoldingsEditorProps {
  draft: HoldingsSnapshot;
  onDraftChange: (snapshot: HoldingsSnapshot) => void;
}

const ASSET_TYPES = Object.keys(ASSET_TYPE_LABELS) as AssetType[];
const CURRENCIES = Object.keys(CURRENCY_LABELS) as Currency[];

interface PendingHolding {
  ticker: string;
  quantity: number;
  avgCost: number;
  assetType: AssetType;
  currency: Currency;
}

export function HoldingsEditor({ draft, onDraftChange }: HoldingsEditorProps) {
  const [ticker, setTicker] = useState("");
  const [quantity, setQuantity] = useState("");
  const [avgCost, setAvgCost] = useState("");
  const [assetType, setAssetType] = useState<AssetType>("stock");
  const [currency, setCurrency] = useState<Currency>("KRW");
  const [sectorDialogOpen, setSectorDialogOpen] = useState(false);
  const [pendingHolding, setPendingHolding] = useState<PendingHolding | null>(null);

  function updateCash(key: keyof HoldingsSnapshot["cash"], value: string) {
    onDraftChange({
      ...draft,
      cash: { ...draft.cash, [key]: parseNumericInput(value) },
    });
  }

  function appendHolding(
    base: PendingHolding,
    classification?: TickerClassification | { sector: AgentSectorId; region?: Region }
  ) {
    const holding: Holding = {
      id: crypto.randomUUID(),
      ticker: base.ticker,
      quantity: base.quantity,
      avgCost: base.avgCost,
      assetType: base.assetType,
      currency: base.currency,
    };
    const tagged = classification
      ? applySectorTag(holding, classification.sector, classification.region)
      : holding;
    onDraftChange({
      ...draft,
      holdings: [...draft.holdings, tagged],
    });
    setTicker("");
    setQuantity("");
    setAvgCost("");
    setPendingHolding(null);
  }

  function addHolding() {
    const trimmed = ticker.trim().toUpperCase();
    const qty = parseNumericInput(quantity);
    const cost = parseNumericInput(avgCost);
    if (!trimmed || qty <= 0 || cost <= 0) return;

    const pending: PendingHolding = {
      ticker: trimmed,
      quantity: qty,
      avgCost: cost,
      assetType,
      currency,
    };

    const classification = classifyTicker(trimmed);
    if (classification) {
      appendHolding(pending, classification);
      return;
    }

    setPendingHolding(pending);
    setSectorDialogOpen(true);
  }

  function handleSectorConfirm(sector: AgentSectorId, region?: Region) {
    if (!pendingHolding) return;
    appendHolding(pendingHolding, { sector, region });
  }

  function removeHolding(id: string) {
    onDraftChange({
      ...draft,
      holdings: draft.holdings.filter((h) => h.id !== id),
    });
  }

  return (
    <div className="space-y-6">
      <FieldSet>
        <FieldLegend>통화별 현금</FieldLegend>
        <FieldGroup>
          <Field>
            <Label htmlFor="cash-krw">KRW</Label>
            <Input
              id="cash-krw"
              inputMode="numeric"
              value={draft.cash.krw || ""}
              onChange={(e) => updateCash("krw", e.target.value)}
            />
          </Field>
          <Field>
            <Label htmlFor="cash-usd">USD</Label>
            <Input
              id="cash-usd"
              inputMode="decimal"
              value={draft.cash.usd || ""}
              onChange={(e) => updateCash("usd", e.target.value)}
            />
          </Field>
          <Field>
            <Label htmlFor="cash-jpy">JPY</Label>
            <Input
              id="cash-jpy"
              inputMode="numeric"
              value={draft.cash.jpy || ""}
              onChange={(e) => updateCash("jpy", e.target.value)}
            />
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>종목 추가</FieldLegend>
        <FieldGroup className="grid gap-3 sm:grid-cols-2">
          <Field>
            <Label htmlFor="holding-ticker">티커</Label>
            <Input
              id="holding-ticker"
              placeholder="AAPL"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
            />
          </Field>
          <Field>
            <Label htmlFor="holding-quantity">수량</Label>
            <Input
              id="holding-quantity"
              inputMode="decimal"
              placeholder="10"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </Field>
          <Field>
            <Label htmlFor="holding-avg-cost">매수가 (1주, 결제 통화)</Label>
            <Input
              id="holding-avg-cost"
              inputMode="decimal"
              placeholder="245"
              value={avgCost}
              onChange={(e) => setAvgCost(e.target.value)}
            />
          </Field>
          <Field>
            <Label htmlFor="holding-asset-type">자산 유형</Label>
            <select
              id="holding-asset-type"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              value={assetType}
              onChange={(e) => setAssetType(e.target.value as AssetType)}
            >
              {ASSET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {ASSET_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </Field>
          <Field>
            <Label htmlFor="holding-currency">결제 통화</Label>
            <select
              id="holding-currency"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {CURRENCY_LABELS[c]}
                </option>
              ))}
            </select>
          </Field>
        </FieldGroup>
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={addHolding}>
          <PlusIcon className="mr-1 h-4 w-4" aria-hidden />
          종목 추가
        </Button>
      </FieldSet>

      {draft.holdings.length > 0 ? (
        <ul className="space-y-2 text-sm">
          {draft.holdings.map((h) => (
            <li
              key={h.id}
              className="flex items-center justify-between rounded-md border px-3 py-2"
            >
              <span>
                {h.ticker} · {h.quantity} ·{" "}
                {h.avgCost != null ? `${formatPrice(h.currency, h.avgCost)} 매수 · ` : ""}
                {ASSET_TYPE_LABELS[h.assetType]} · {CURRENCY_LABELS[h.currency]}
                {h.sector ? ` · ${h.sector}` : ""}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`${h.ticker} 삭제`}
                onClick={() => removeHolding(h.id)}
              >
                <Trash2Icon className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      <SectorTagDialog
        open={sectorDialogOpen}
        ticker={pendingHolding?.ticker ?? ""}
        onOpenChange={setSectorDialogOpen}
        onConfirm={handleSectorConfirm}
      />
    </div>
  );
}
