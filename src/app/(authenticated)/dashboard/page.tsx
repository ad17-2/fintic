"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { IncomeExpenseTrend } from "@/components/dashboard/income-expense-trend";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { DailySpending } from "@/components/dashboard/daily-spending";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface SummaryData {
  totalIncome: number;
  totalExpenses: number;
  net: number;
  balance: number;
  incomeChange: number;
  expenseChange: number;
  dailySpending: Array<{ day: number; amount: number }>;
}

interface CategoryData {
  categoryName: string;
  color: string;
  total: number;
  percentage: number;
}

interface TrendData {
  label: string;
  income: number;
  expense: number;
}

export default function DashboardPage() {
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);

  const fetchData = useCallback(async () => {
    const [summaryRes, catRes, trendRes] = await Promise.all([
      fetch(`/api/stats/summary?month=${month}&year=${year}`),
      fetch(`/api/stats/by-category?month=${month}&year=${year}&type=debit`),
      fetch("/api/stats/trends?months=12"),
    ]);

    if (summaryRes.ok) setSummary(await summaryRes.json());
    if (catRes.ok) setCategories(await catRes.json());
    if (trendRes.ok) setTrends(await trendRes.json());
  }, [month, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i} value={String(i + 1)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {summary && <SummaryCards data={summary} />}

      <div className="grid gap-6 lg:grid-cols-2">
        <IncomeExpenseTrend data={trends} />
        <CategoryBreakdown data={categories} />
      </div>

      {summary && <DailySpending data={summary.dailySpending} />}
    </div>
  );
}
