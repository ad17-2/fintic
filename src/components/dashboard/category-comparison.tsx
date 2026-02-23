"use client";

import { useRouter } from "next/navigation";
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
import { formatAxis, truncate } from "@/lib/chart-utils";
import type { ComparisonData } from "@/lib/types";

const chartConfig = {
  current: { label: "This Month", theme: { light: "oklch(0.600 0.118 184)", dark: "oklch(0.650 0.130 184)" } },
  previous: { label: "Last Month", theme: { light: "oklch(0.700 0.020 265)", dark: "oklch(0.550 0.015 265)" } },
} satisfies ChartConfig;

interface CategoryComparisonProps {
  data: ComparisonData[];
  month: string;
  year: string;
}

export function CategoryComparison({ data, month, year }: CategoryComparisonProps) {
  const router = useRouter();
  const noPreviousData = data.length === 0 || data.every((d) => d.previous === 0);

  if (noPreviousData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {data.length === 0 ? "No data yet" : "Not enough data — need at least 2 months"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: truncate(d.category, 14),
  }));

  function handleClick(entry: { categoryId?: number | null }) {
    if (!entry.categoryId) return;
    const params = new URLSearchParams({ month, year, categoryId: String(entry.categoryId), type: "debit" });
    router.push(`/transactions?${params}`);
  }

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
              style={{ cursor: "pointer" }}
              onClick={(_: unknown, index: number) => handleClick(chartData[index])}
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
