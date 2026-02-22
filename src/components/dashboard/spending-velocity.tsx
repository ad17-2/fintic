"use client";

import { Gauge } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatIDR } from "@/lib/format";

interface VelocityData {
  totalSpent: number;
  avgDailySpend: number;
  daysElapsed: number;
  daysRemaining: number;
  daysInMonth: number;
  projectedTotal: number;
  budget: number;
  budgetRemaining: number;
  pacePercent: number;
}

function getBarColor(pacePercent: number): string {
  if (pacePercent > 100) return "bg-rose-500";
  if (pacePercent > 80) return "bg-amber-500";
  return "bg-emerald-500";
}

function getTextColor(pacePercent: number): string {
  if (pacePercent > 100) return "text-rose-600 dark:text-rose-400";
  if (pacePercent > 80) return "text-amber-600 dark:text-amber-400";
  return "text-emerald-600 dark:text-emerald-400";
}

export function SpendingVelocity({ data }: { data: VelocityData }) {
  if (data.daysElapsed === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary" />
            Spending Velocity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No data yet</p>
        </CardContent>
      </Card>
    );
  }

  const clampedPercent = Math.min(data.pacePercent, 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-primary" />
          Spending Velocity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          At this pace, you&apos;ll spend{" "}
          <span className={`font-bold ${getTextColor(data.pacePercent)}`}>
            {formatIDR(data.projectedTotal)}
          </span>{" "}
          by month-end
        </p>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatIDR(data.totalSpent)} spent</span>
            <span>{formatIDR(data.budget)} income</span>
          </div>
          <div className="h-3 w-full rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${getBarColor(data.pacePercent)}`}
              style={{ width: `${clampedPercent}%` }}
            />
          </div>
          <p className={`text-xs font-medium ${getTextColor(data.pacePercent)}`}>
            {data.pacePercent}% of income (projected)
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-2">
          <div>
            <p className="text-xs text-muted-foreground">Avg Daily</p>
            <p className="text-sm font-semibold">{formatIDR(data.avgDailySpend)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Days Left</p>
            <p className="text-sm font-semibold">{data.daysRemaining}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Budget Remaining</p>
            <p className={`text-sm font-semibold ${data.budgetRemaining >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
              {formatIDR(Math.abs(data.budgetRemaining))}
              {data.budgetRemaining < 0 && " over"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
