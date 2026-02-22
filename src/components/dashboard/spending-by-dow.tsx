"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAxis } from "@/lib/chart-utils";
import type { DowItem } from "@/lib/types";

const chartConfig = {
  total: {
    label: "Spending",
    theme: { light: "oklch(0.600 0.118 184)", dark: "oklch(0.650 0.130 184)" },
  },
  peak: {
    label: "Peak Day",
    theme: { light: "oklch(0.645 0.246 16)", dark: "oklch(0.700 0.220 16)" },
  },
} satisfies ChartConfig;

export function SpendingByDow({ data }: { data: DowItem[] }) {
  if (data.length === 0 || data.every((d) => d.total === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spending by Day</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No data yet</p>
        </CardContent>
      </Card>
    );
  }

  const maxTotal = Math.max(...data.map((d) => d.total));
  const average = data.reduce((sum, d) => sum + d.total, 0) / data.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Day</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={formatAxis}
              width={50}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ReferenceLine
              y={average}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="3 3"
              label={{
                value: "Avg",
                position: "insideTopRight",
                className: "text-xs fill-muted-foreground",
              }}
            />
            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell
                  key={entry.day}
                  fill={entry.total === maxTotal ? "var(--color-peak)" : "var(--color-total)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
