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
import { SpendingVelocity } from "@/components/dashboard/spending-velocity";
import { IncomeExpenseTrend } from "@/components/dashboard/income-expense-trend";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { DailySpending } from "@/components/dashboard/daily-spending";
import { TopMerchants } from "@/components/dashboard/top-merchants";
import { CategoryComparison } from "@/components/dashboard/category-comparison";
import { YoYComparison } from "@/components/dashboard/yoy-comparison";
import { SpendingByDow } from "@/components/dashboard/spending-by-dow";
import { SavingsRate } from "@/components/dashboard/savings-rate";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface SummaryData {
  totalIncome: number;
  totalExpenses: number;
  allocations: number;
  net: number;
  balance: number;
  incomeChange: number;
  expenseChange: number;
  allocationChange: number;
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

interface MerchantData {
  merchant: string;
  total: number;
  count: number;
}

interface ComparisonData {
  category: string;
  color: string;
  current: number;
  previous: number;
}

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

interface YoYItem {
  category: string;
  color: string;
  current: number;
  previousYear: number;
  changePercent: number;
}

interface DowItem {
  day: string;
  total: number;
  count: number;
}

interface SavingsRateItem {
  label: string;
  savingsRate: number;
}

export default function DashboardPage() {
  const [month, setMonth] = useState<string | null>(null);
  const [year, setYear] = useState<string | null>(null);
  const [periodResolved, setPeriodResolved] = useState(false);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [topMerchants, setTopMerchants] = useState<MerchantData[]>([]);
  const [categoryComparison, setCategoryComparison] = useState<ComparisonData[]>([]);
  const [velocity, setVelocity] = useState<VelocityData | null>(null);
  const [yoyComparison, setYoyComparison] = useState<YoYItem[]>([]);
  const [dayOfWeek, setDayOfWeek] = useState<DowItem[]>([]);
  const [savingsRate, setSavingsRate] = useState<SavingsRateItem[]>([]);

  useEffect(() => {
    async function resolveDefaultPeriod() {
      const res = await fetch("/api/stats/trends?months=120");
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          const latest = data[data.length - 1];
          setMonth(String(latest.month));
          setYear(String(latest.year));
          setPeriodResolved(true);
          return;
        }
      }
      setMonth(String(new Date().getMonth() + 1));
      setYear(String(new Date().getFullYear()));
      setPeriodResolved(true);
    }
    resolveDefaultPeriod();
  }, []);

  const fetchData = useCallback(async () => {
    if (!month || !year) return;

    const [
      summaryRes, catRes, trendRes, merchantsRes, comparisonRes,
      velocityRes, yoyRes, dowRes, savingsRes,
    ] = await Promise.all([
      fetch(`/api/stats/summary?month=${month}&year=${year}`),
      fetch(`/api/stats/by-category?month=${month}&year=${year}&type=debit`),
      fetch("/api/stats/trends?months=12"),
      fetch(`/api/stats/top-merchants?month=${month}&year=${year}`),
      fetch(`/api/stats/category-comparison?month=${month}&year=${year}`),
      fetch(`/api/stats/spending-velocity?month=${month}&year=${year}`),
      fetch(`/api/stats/yoy-comparison?month=${month}&year=${year}`),
      fetch(`/api/stats/spending-by-dow?month=${month}&year=${year}`),
      fetch("/api/stats/savings-rate?months=12"),
    ]);

    if (summaryRes.ok) setSummary(await summaryRes.json());
    if (catRes.ok) setCategories(await catRes.json());
    if (trendRes.ok) setTrends(await trendRes.json());
    if (merchantsRes.ok) setTopMerchants(await merchantsRes.json());
    if (comparisonRes.ok) setCategoryComparison(await comparisonRes.json());
    if (velocityRes.ok) setVelocity(await velocityRes.json());
    if (yoyRes.ok) setYoyComparison(await yoyRes.json());
    if (dowRes.ok) setDayOfWeek(await dowRes.json());
    if (savingsRes.ok) setSavingsRate(await savingsRes.json());
  }, [month, year]);

  useEffect(() => {
    if (periodResolved) fetchData();
  }, [periodResolved, fetchData]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  if (!periodResolved) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Select value={month!} onValueChange={setMonth}>
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
          <Select value={year!} onValueChange={setYear}>
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

      {velocity && <SpendingVelocity data={velocity} />}

      <div className="grid gap-6 lg:grid-cols-2">
        <IncomeExpenseTrend data={trends} />
        <CategoryBreakdown data={categories} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TopMerchants data={topMerchants} />
        <CategoryComparison data={categoryComparison} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <YoYComparison data={yoyComparison} />
        <SpendingByDow data={dayOfWeek} />
      </div>

      <SavingsRate data={savingsRate} />

      {summary && <DailySpending data={summary.dailySpending} />}
    </div>
  );
}
