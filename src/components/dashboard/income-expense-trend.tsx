"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TrendData {
  label: string;
  income: number;
  expense: number;
}

const chartConfig = {
  income: { label: "Income", theme: { light: "oklch(0.696 0.170 163)", dark: "oklch(0.740 0.160 163)" } },
  expense: { label: "Expenses", theme: { light: "oklch(0.645 0.246 16)", dark: "oklch(0.700 0.220 16)" } },
} satisfies ChartConfig;

function formatAxis(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

export function IncomeExpenseTrend({ data }: { data: TrendData[] }) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Income vs Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No data yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Income vs Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-income)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-income)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-expense)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-expense)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickFormatter={formatAxis} width={50} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              dataKey="income"
              stroke="var(--color-income)"
              strokeWidth={2}
              fill="url(#incomeGrad)"
              type="monotone"
            />
            <Area
              dataKey="expense"
              stroke="var(--color-expense)"
              strokeWidth={2}
              fill="url(#expenseGrad)"
              type="monotone"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
