"use client";

import { Gauge } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatIDR } from "@/lib/format";
import type { VelocityData } from "@/lib/types";

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

  const monthComplete = data.daysRemaining === 0;
  const spentPercent = data.budget > 0 ? Math.min((data.totalSpent / data.budget) * 100, 100) : 0;
  const clampedPercent = monthComplete ? spentPercent : Math.min(data.pacePercent, 100);
  const actualPacePercent = monthComplete
    ? (data.budget > 0 ? Math.round((data.totalSpent / data.budget) * 1000) / 10 : 0)
    : data.pacePercent;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-primary" />
          Spending Velocity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {monthComplete ? (
          <p className="text-sm text-muted-foreground">
            Month complete — you spent{" "}
            <span className={`font-bold ${getTextColor(actualPacePercent)}`}>
              {formatIDR(data.totalSpent)}
            </span>{" "}
            of {formatIDR(data.budget)} income
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            At this pace, you&apos;ll spend{" "}
            <span className={`font-bold ${getTextColor(data.pacePercent)}`}>
              {formatIDR(data.projectedTotal)}
            </span>{" "}
            by month-end
          </p>
        )}

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatIDR(data.totalSpent)} spent</span>
            <span>{formatIDR(data.budget)} income</span>
          </div>
          <div className="h-3 w-full rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${getBarColor(actualPacePercent)}`}
              style={{ width: `${clampedPercent}%` }}
            />
          </div>
          <p className={`text-xs font-medium ${getTextColor(actualPacePercent)}`}>
            {actualPacePercent}% of income{monthComplete ? "" : " (projected)"}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-2">
          <div>
            <p className="text-xs text-muted-foreground">Avg Daily</p>
            <p className="text-sm font-semibold">{formatIDR(data.avgDailySpend)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{monthComplete ? "Days" : "Days Left"}</p>
            <p className="text-sm font-semibold">{monthComplete ? data.daysInMonth : data.daysRemaining}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{monthComplete ? "Net" : "Budget Remaining"}</p>
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
