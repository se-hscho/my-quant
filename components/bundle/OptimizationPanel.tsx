"use client";

import * as React from "react";
import type { OptimizationMethod } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InfoTooltip } from "@/components/common/InfoTooltip";

const METHODS: {
  value: OptimizationMethod;
  label: string;
  description: string;
}[] = [
  {
    value: "max-sharpe",
    label: "Max Sharpe",
    description: "위험 대비 기대 수익률(샤프비율)이 가장 높은 비중을 찾습니다.",
  },
  {
    value: "min-variance",
    label: "Min Variance",
    description: "전체 변동성이 가장 낮은 비중을 찾습니다.",
  },
  {
    value: "risk-parity",
    label: "Risk Parity",
    description: "각 자산이 위험에 동일하게 기여하도록 비중을 조정합니다.",
  },
];

export interface OptimizationPanelProps {
  method: OptimizationMethod;
  onMethodChange: (m: OptimizationMethod) => void;
  onRun: () => void;
  disabled?: boolean;
}

export function OptimizationPanel({
  method,
  onMethodChange,
  onRun,
  disabled,
}: OptimizationPanelProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 py-4">
        <div className="text-sm font-medium">최적화 방법</div>
        <div
          role="radiogroup"
          aria-label="최적화 방법"
          className="flex flex-col gap-2"
        >
          {METHODS.map((m) => (
            <div key={m.value} className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="optimization-method"
                  value={m.value}
                  checked={method === m.value}
                  onChange={() => onMethodChange(m.value)}
                />
                <span className="text-sm">{m.label}</span>
              </label>
              <InfoTooltip label={m.label} description={m.description} />
            </div>
          ))}
        </div>
        <Button onClick={onRun} disabled={disabled}>
          최적화 실행
        </Button>
      </CardContent>
    </Card>
  );
}
