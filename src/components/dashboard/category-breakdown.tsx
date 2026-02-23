"use client";

import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CategoryData } from "@/lib/types";

interface CategoryBreakdownProps {
  data: CategoryData[];
  month: string;
  year: string;
}

export function CategoryBreakdown({ data, month, year }: CategoryBreakdownProps) {
  const router = useRouter();

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No data yet</p>
        </CardContent>
      </Card>
    );
  }

  const chartConfig = data.reduce(
    (acc, item) => {
      acc[item.categoryName] = {
        label: item.categoryName,
        color: item.color,
      };
      return acc;
    },
    { total: { label: "Amount" } } as ChartConfig
  );

  const chartData = data.map((d) => ({
    category: d.categoryName,
    categoryId: d.categoryId,
    amount: d.total,
    fill: d.color,
  }));

  function handleClick(entry: { categoryId?: number | null }) {
    if (!entry.categoryId) return;
    const params = new URLSearchParams({ month, year, categoryId: String(entry.categoryId), type: "debit" });
    router.push(`/transactions?${params}`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto h-[300px] w-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="category" />} />
            <Pie
              data={chartData}
              dataKey="amount"
              nameKey="category"
              innerRadius={60}
              outerRadius={100}
              strokeWidth={2}
              stroke="var(--background)"
              style={{ cursor: "pointer" }}
              onClick={(_: unknown, index: number) => handleClick(chartData[index])}
            >
              {chartData.map((entry) => (
                <Cell key={entry.category} fill={entry.fill} />
              ))}
            </Pie>
            <ChartLegend
              content={<ChartLegendContent nameKey="category" />}
              className="-translate-y-2 flex-wrap gap-2 text-xs"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
