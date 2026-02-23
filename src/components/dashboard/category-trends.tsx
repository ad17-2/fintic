"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAxis } from "@/lib/chart-utils";
import type { CategoryTrendItem } from "@/lib/types";

export function CategoryTrends({ data }: { data: CategoryTrendItem[] }) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No data yet</p>
        </CardContent>
      </Card>
    );
  }

  const monthLabels = data[0].months.map((m) => m.label);

  const chartData = monthLabels.map((label, i) => {
    const point: Record<string, string | number> = { label };
    for (const cat of data) {
      point[cat.categoryName] = cat.months[i]?.total ?? 0;
    }
    return point;
  });

  const chartConfig = data.reduce(
    (acc, item) => {
      acc[item.categoryName] = { label: item.categoryName, color: item.color };
      return acc;
    },
    {} as ChartConfig
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
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
            <ChartLegend
              content={<ChartLegendContent />}
              className="flex-wrap gap-2 text-xs"
            />
            {data.map((cat) => (
              <Line
                key={cat.categoryName}
                type="monotone"
                dataKey={cat.categoryName}
                stroke={cat.color}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
