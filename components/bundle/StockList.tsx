"use client";

import * as React from "react";
import type { Stock } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { XIcon, PlusIcon } from "lucide-react";

const MIN_STOCKS = 2;

export interface StockListProps {
  stocks: Stock[];
  onChange: (next: Stock[]) => void;
}

export function StockList({ stocks, onChange }: StockListProps) {
  const [tickerInput, setTickerInput] = React.useState("");

  const removeDisabled = stocks.length <= MIN_STOCKS;

  const handleRemove = (ticker: string) => {
    if (removeDisabled) return;
    onChange(stocks.filter((s) => s.ticker !== ticker));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const t = tickerInput.trim().toUpperCase();
    if (!t) return;
    if (stocks.some((s) => s.ticker === t)) {
      setTickerInput("");
      return;
    }
    onChange([...stocks, { ticker: t, name: t, description: "사용자 추가" }]);
    setTickerInput("");
  };

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2" aria-label="종목 목록">
        {stocks.map((s) => (
          <li key={s.ticker}>
            <Card size="sm" data-testid={`stock-${s.ticker}`}>
              <CardContent className="flex items-center gap-3">
                <div className="font-mono text-sm font-semibold w-16">
                  {s.ticker}
                </div>
                <div className="flex-1">
                  <div className="text-sm">{s.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.description}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`${s.ticker} 제거`}
                  disabled={removeDisabled}
                  onClick={() => handleRemove(s.ticker)}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          aria-label="티커 추가"
          placeholder="티커 입력 (예: AAPL)"
          value={tickerInput}
          onChange={(e) => setTickerInput(e.target.value)}
          className="flex-1"
        />
        <Button type="submit">
          <PlusIcon className="h-4 w-4" data-icon="inline-start" />
          추가
        </Button>
      </form>
      {removeDisabled && (
        <p className="text-xs text-muted-foreground">
          최소 {MIN_STOCKS}개 종목이 필요합니다.
        </p>
      )}
    </div>
  );
}
