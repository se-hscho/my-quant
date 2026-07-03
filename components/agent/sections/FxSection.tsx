"use client";

import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Briefing } from "@/services/briefing/types";
import { ChartWithCaption } from "../ChartWithCaption";

export function FxSection({ fx }: { fx: Briefing["sections"]["fx"] }) {
  return (
    <ChartWithCaption
      title="환율·환전 시점"
      caption={`USD/KRW ${fx.usdKrw.toLocaleString("ko-KR")} · 권장 시점: ${fx.rebalanceTiming}`}
      interpretation={fx.rationale}
    >
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={fx.trend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" fontSize={12} />
            <YAxis fontSize={12} domain={["auto", "auto"]} />
            <Tooltip />
            <Line type="monotone" dataKey="rate" stroke="hsl(var(--chart-1))" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {fx.rebalanceAmountKrw > 0 ? (
        <p className="text-sm">
          환전 검토액: ₩{Math.round(fx.rebalanceAmountKrw).toLocaleString("ko-KR")} (≈ $
          {fx.rebalanceAmountUsd.toLocaleString("en-US")})
        </p>
      ) : null}
    </ChartWithCaption>
  );
}
