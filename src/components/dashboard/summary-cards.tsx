"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatIDR } from "@/lib/format";
import type { SummaryData, CategoryData } from "@/lib/types";

interface SummaryCardsProps {
  data: SummaryData;
  categories: CategoryData[];
  month: string;
  year: string;
}

export function SummaryCards({ data, categories, month, year }: SummaryCardsProps) {
  const router = useRouter();
  const [showBreakdown, setShowBreakdown] = useState(false);

  const cards = [
    {
      label: "Total Income",
      value: formatIDR(data.totalIncome),
      change: data.incomeChange,
      icon: TrendingUp,
      color: "text-emerald-600 dark:text-emerald-400",
      accent: "border-t-emerald-500",
      subtitle: null,
      clickable: false,
    },
    {
      label: "Total Expenses",
      value: formatIDR(data.totalExpenses),
      change: data.expenseChange,
      icon: TrendingDown,
      color: "text-rose-600 dark:text-rose-400",
      accent: "border-t-rose-500",
      subtitle: "Excludes Investing, Tithe, Family",
      clickable: true,
    },
    {
      label: "Allocations",
      value: formatIDR(data.allocations),
      change: data.allocationChange,
      icon: PiggyBank,
      color: "text-indigo-600 dark:text-indigo-400",
      accent: "border-t-indigo-500",
      subtitle: "Investing, Tithe, Family",
      clickable: false,
    },
    {
      label: "Net Cash Flow",
      value: formatIDR(data.net),
      change: null,
      icon: Activity,
      color: data.net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
      accent: "border-t-primary",
      subtitle: null,
      clickable: false,
    },
    {
      label: "Balance",
      value: formatIDR(data.balance),
      change: null,
      icon: Wallet,
      color: "text-primary",
      accent: "border-t-slate-500",
      subtitle: null,
      clickable: false,
    },
  ];

  function handleCategoryClick(categoryId: number | null) {
    if (!categoryId) return;
    const params = new URLSearchParams({ month, year, categoryId: String(categoryId), type: "debit" });
    router.push(`/transactions?${params}`);
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <Card
            key={card.label}
            className={`border-t-2 ${card.accent} ${card.clickable ? "cursor-pointer transition-colors hover:bg-muted/50" : ""}`}
            onClick={card.clickable ? () => setShowBreakdown(true) : undefined}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <p className={`mt-2 text-lg font-bold xl:text-2xl ${card.color} truncate`}>
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

      <Dialog open={showBreakdown} onOpenChange={setShowBreakdown}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Expenses by Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            {categories.map((cat) => (
              <button
                key={cat.categoryName}
                type="button"
                className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm hover:bg-muted/80 transition-colors"
                onClick={() => handleCategoryClick(cat.categoryId)}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span>{cat.categoryName}</span>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <span className="font-medium">{formatIDR(cat.total)}</span>
                  <span className="text-xs text-muted-foreground w-10">{cat.percentage}%</span>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
