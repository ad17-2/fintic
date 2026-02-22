"use client";

import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Activity,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatIDR } from "@/lib/format";

interface SummaryData {
  totalIncome: number;
  totalExpenses: number;
  net: number;
  balance: number;
  incomeChange: number;
  expenseChange: number;
}

export function SummaryCards({ data }: { data: SummaryData }) {
  const cards = [
    {
      label: "Total Income",
      value: formatIDR(data.totalIncome),
      change: data.incomeChange,
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      label: "Total Expenses",
      value: formatIDR(data.totalExpenses),
      change: data.expenseChange,
      icon: TrendingDown,
      color: "text-red-600",
    },
    {
      label: "Net Cash Flow",
      value: formatIDR(data.net),
      change: null,
      icon: Activity,
      color: data.net >= 0 ? "text-green-600" : "text-red-600",
    },
    {
      label: "Balance",
      value: formatIDR(data.balance),
      change: null,
      icon: Wallet,
      color: "text-foreground",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <p className={`mt-2 text-2xl font-bold ${card.color}`}>
              {card.value}
            </p>
            {card.change !== null && card.change !== 0 && (
              <div className="mt-1 flex items-center text-xs">
                {card.change > 0 ? (
                  <ArrowUpRight className="mr-1 h-3 w-3 text-green-600" />
                ) : (
                  <ArrowDownRight className="mr-1 h-3 w-3 text-red-600" />
                )}
                <span
                  className={
                    card.change > 0 ? "text-green-600" : "text-red-600"
                  }
                >
                  {Math.abs(card.change).toFixed(1)}% vs last month
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
