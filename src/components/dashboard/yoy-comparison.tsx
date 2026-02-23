"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
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
import type { YoYItem } from "@/lib/types";

const chartConfig = {
  current: { label: "This Year", theme: { light: "oklch(0.600 0.118 184)", dark: "oklch(0.650 0.130 184)" } },
  previousYear: { label: "Last Year", theme: { light: "oklch(0.700 0.020 265)", dark: "oklch(0.550 0.015 265)" } },
} satisfies ChartConfig;

export function YoYComparison({ data }: { data: YoYItem[] }) {
  const noPreviousData = data.length === 0 || data.every((d) => d.previousYear === 0);

  if (noPreviousData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Year-over-Year</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {data.length === 0 ? "No data yet" : "Not enough data — need data from the same month last year"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.slice(0, 8).map((d) => ({
    ...d,
    label: truncate(d.category, 14),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Year-over-Year</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid horizontal={false} />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tickFormatter={formatAxis}
            />
            <YAxis
              type="category"
              dataKey="label"
              tickLine={false}
              axisLine={false}
              width={110}
              tick={{ fontSize: 12 }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="current" fill="var(--color-current)" radius={[0, 4, 4, 0]} />
            <Bar dataKey="previousYear" fill="var(--color-previousYear)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>

        <div className="space-y-1">
          {data.slice(0, 5).map((d) => (
            <div key={d.category} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{d.category}</span>
              {d.changePercent !== 0 && (
                <span className={`flex items-center gap-0.5 font-medium ${d.changePercent > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                  {d.changePercent > 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {Math.abs(d.changePercent)}%
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
