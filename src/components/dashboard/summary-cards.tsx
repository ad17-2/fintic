"use client";

import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Activity,
  PiggyBank,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatIDR } from "@/lib/format";

interface SummaryData {
  totalIncome: number;
  totalExpenses: number;
  allocations: number;
  net: number;
  balance: number;
  incomeChange: number;
  expenseChange: number;
  allocationChange: number;
}

export function SummaryCards({ data }: { data: SummaryData }) {
  const cards = [
    {
      label: "Total Income",
      value: formatIDR(data.totalIncome),
      change: data.incomeChange,
      icon: TrendingUp,
      color: "text-emerald-600 dark:text-emerald-400",
      accent: "border-t-emerald-500",
      subtitle: null,
    },
    {
      label: "Total Expenses",
      value: formatIDR(data.totalExpenses),
      change: data.expenseChange,
      icon: TrendingDown,
      color: "text-rose-600 dark:text-rose-400",
      accent: "border-t-rose-500",
      subtitle: null,
    },
    {
      label: "Allocations",
      value: formatIDR(data.allocations),
      change: data.allocationChange,
      icon: PiggyBank,
      color: "text-indigo-600 dark:text-indigo-400",
      accent: "border-t-indigo-500",
      subtitle: "Investing, Tithe, Family",
    },
    {
      label: "Net Cash Flow",
      value: formatIDR(data.net),
      change: null,
      icon: Activity,
      color: data.net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
      accent: "border-t-primary",
      subtitle: null,
    },
    {
      label: "Balance",
      value: formatIDR(data.balance),
      change: null,
      icon: Wallet,
      color: "text-primary",
      accent: "border-t-slate-500",
      subtitle: null,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.label} className={`border-t-2 ${card.accent}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <p className={`mt-2 text-2xl font-bold ${card.color}`}>
              {card.value}
            </p>
            {card.subtitle && (
              <p className="mt-1 text-xs text-muted-foreground">
                {card.subtitle}
              </p>
            )}
            {card.change !== null && card.change !== 0 && (
              <div className="mt-1 flex items-center text-xs">
                {card.change > 0 ? (
                  <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <ArrowDownRight className="mr-1 h-3 w-3 text-rose-600 dark:text-rose-400" />
                )}
                <span
                  className={
                    card.change > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
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
