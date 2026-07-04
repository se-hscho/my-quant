"use client";

import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "hsl(220 70% 50%)",
  "hsl(170 70% 45%)",
  "hsl(30 80% 55%)",
  "hsl(340 70% 55%)",
  "hsl(280 60% 55%)",
  "hsl(120 50% 45%)",
  "hsl(50 80% 55%)",
  "hsl(200 70% 60%)",
];

export function WeightPieChart({
  weights,
}: {
  weights: Record<string, number>;
}) {
  const data = Object.entries(weights)
    .map(([ticker, w]) => ({ name: ticker, value: w }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius="55%"
            label={(entry) =>
              `${entry.name} ${((entry.value as number) ?? 0).toFixed(1)}%`
            }
          >
            {data.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <RechartsTooltip
            formatter={(v) =>
              typeof v === "number" ? `${v.toFixed(1)}%` : String(v)
            }
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
