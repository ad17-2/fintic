"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MerchantData {
  merchant: string;
  total: number;
  count: number;
}

const chartConfig = {
  total: { label: "Amount", theme: { light: "oklch(0.600 0.118 184)", dark: "oklch(0.650 0.130 184)" } },
} satisfies ChartConfig;

function formatAxis(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

export function TopMerchants({ data }: { data: MerchantData[] }) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Merchants</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No data yet</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    merchant: d.merchant,
    label: truncate(d.merchant, 18),
    total: d.total,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Merchants</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
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
              width={130}
              tick={{ fontSize: 12 }}
            />
            <ChartTooltip
              content={<ChartTooltipContent nameKey="merchant" />}
            />
            <Bar
              dataKey="total"
              fill="var(--color-total)"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
