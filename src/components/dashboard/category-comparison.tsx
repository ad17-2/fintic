"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ComparisonData {
  category: string;
  color: string;
  current: number;
  previous: number;
}

const chartConfig = {
  current: { label: "This Month", theme: { light: "oklch(0.600 0.118 184)", dark: "oklch(0.650 0.130 184)" } },
  previous: { label: "Last Month", theme: { light: "oklch(0.700 0.020 265)", dark: "oklch(0.550 0.015 265)" } },
} satisfies ChartConfig;

function formatAxis(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

export function CategoryComparison({ data }: { data: ComparisonData[] }) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No data yet</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: truncate(d.category, 14),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={formatAxis}
              width={50}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="current"
              fill="var(--color-current)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="previous"
              fill="var(--color-previous)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
