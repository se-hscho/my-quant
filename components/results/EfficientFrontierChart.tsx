"use client";

import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import type { PortfolioPoint } from "@/types";

export interface EfficientFrontierChartProps {
  frontier: PortfolioPoint[];
  optimal: PortfolioPoint;
}

export function EfficientFrontierChart({
  frontier,
  optimal,
}: EfficientFrontierChartProps) {
  const points = frontier.map((p) => ({
    x: p.volatility,
    y: p.expectedReturn,
    z: 1,
  }));
  const optimalPoint = [{ x: optimal.volatility, y: optimal.expectedReturn, z: 100 }];

  return (
    <div className="h-[360px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 16, right: 16, left: 8, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="x"
            name="변동성"
            label={{ value: "변동성", position: "insideBottom", offset: -10 }}
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="기대수익률"
            label={{ value: "기대수익률", angle: -90, position: "insideLeft" }}
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
          />
          <ZAxis dataKey="z" domain={[1, 100]} range={[8, 160]} />
          <RechartsTooltip
            formatter={(v) =>
              typeof v === "number" ? `${(v * 100).toFixed(2)}%` : String(v)
            }
            cursor={{ strokeDasharray: "3 3" }}
          />
          <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 8 }} />
          <Scatter
            name="시뮬레이션"
            data={points}
            fill="#94a3b8"
            fillOpacity={0.4}
          />
          <Scatter
            name="최적 포트폴리오"
            data={optimalPoint}
            fill="#f97316"
            shape="star"
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
