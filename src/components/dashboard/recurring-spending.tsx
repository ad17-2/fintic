"use client";

import { PieChart, Pie, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatIDR } from "@/lib/format";
import type { RecurringData } from "@/lib/types";

const chartConfig = {
  recurring: { label: "Recurring", color: "oklch(0.600 0.118 184)" },
  oneTime: { label: "One-time", color: "oklch(0.700 0.020 265)" },
} satisfies ChartConfig;

export function RecurringSpending({ data }: { data: RecurringData }) {
  const total = data.recurring + data.oneTime;

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recurring vs One-Time</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No data yet</p>
        </CardContent>
      </Card>
    );
  }

  const recurringPct = Math.round((data.recurring / total) * 100);
  const chartData = [
    { name: "Recurring", value: data.recurring, fill: "var(--color-recurring)" },
    { name: "One-time", value: data.oneTime, fill: "var(--color-oneTime)" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recurring vs One-Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <ChartContainer config={chartConfig} className="h-[160px] w-[160px] shrink-0">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={45}
                outerRadius={70}
                strokeWidth={2}
                stroke="var(--background)"
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>

          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Recurring</span>
              <span className="font-medium">{formatIDR(data.recurring)} ({recurringPct}%)</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">One-time</span>
              <span className="font-medium">{formatIDR(data.oneTime)} ({100 - recurringPct}%)</span>
            </div>
          </div>
        </div>

        {data.recurringItems.length > 0 && (
          <div className="mt-4 space-y-2 border-t pt-3">
            <p className="text-xs font-medium text-muted-foreground">Recurring merchants</p>
            {data.recurringItems.map((item) => (
              <div key={item.merchant} className="flex items-center justify-between text-sm">
                <span className="truncate">{item.merchant}</span>
                <span className="shrink-0 font-medium">{formatIDR(item.currentMonthAmount)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
