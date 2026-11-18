"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type MonthlyDatum = {
  month: string;
  [key: string]: string | number;
};

type EarningsChartProps = {
  data: MonthlyDatum[];
  dataKey: string;
  fill?: string;
};

export function EarningsChart({ data, dataKey, fill = "#f59e0b" }: EarningsChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="dark:stroke-zinc-800/50" />
        <XAxis dataKey="month" className="dark:text-gray-400" />
        <YAxis className="dark:text-gray-400" />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--card)",
            borderColor: "var(--border)",
            color: "var(--foreground)",
          }}
        />
        <Bar dataKey={dataKey} fill={fill} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
