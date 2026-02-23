"use client";

import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatIDR } from "@/lib/format";
import type { AnomalyItem } from "@/lib/types";

export function AnomalyCallouts({ data }: { data: AnomalyItem[] }) {
  if (data.length === 0) return null;

  return (
    <Card className="border-amber-200 dark:border-amber-900">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4" />
          Spending Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item) => (
            <div key={item.categoryName} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-medium">{item.categoryName}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground">
                  {formatIDR(item.currentTotal)} vs avg {formatIDR(item.rollingAverage)}
                </span>
                <Badge variant="outline" className="border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400">
                  +{item.percentAboveAverage}%
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
