"use client";

import dynamic from "next/dynamic";
import { PeriodSelector } from "@/components/dashboard/period-selector";
import {
  SummaryCardsSkeleton,
  ChartSkeleton,
  VelocitySkeleton,
} from "@/components/dashboard/chart-skeletons";
import { useDashboardData } from "@/hooks/use-dashboard-data";

const SummaryCards = dynamic(
  () => import("@/components/dashboard/summary-cards").then((m) => ({ default: m.SummaryCards })),
  { loading: () => <SummaryCardsSkeleton />, ssr: false },
);
const SpendingVelocity = dynamic(
  () => import("@/components/dashboard/spending-velocity").then((m) => ({ default: m.SpendingVelocity })),
  { loading: () => <VelocitySkeleton />, ssr: false },
);
const AnomalyCallouts = dynamic(
  () => import("@/components/dashboard/anomaly-callouts").then((m) => ({ default: m.AnomalyCallouts })),
  { ssr: false },
);
const IncomeExpenseTrend = dynamic(
  () => import("@/components/dashboard/income-expense-trend").then((m) => ({ default: m.IncomeExpenseTrend })),
  { loading: () => <ChartSkeleton />, ssr: false },
);
const CategoryBreakdown = dynamic(
  () => import("@/components/dashboard/category-breakdown").then((m) => ({ default: m.CategoryBreakdown })),
  { loading: () => <ChartSkeleton />, ssr: false },
);
const DailySpending = dynamic(
  () => import("@/components/dashboard/daily-spending").then((m) => ({ default: m.DailySpending })),
  { loading: () => <ChartSkeleton />, ssr: false },
);
const TopMerchants = dynamic(
  () => import("@/components/dashboard/top-merchants").then((m) => ({ default: m.TopMerchants })),
  { loading: () => <ChartSkeleton />, ssr: false },
);
const CategoryComparison = dynamic(
  () => import("@/components/dashboard/category-comparison").then((m) => ({ default: m.CategoryComparison })),
  { loading: () => <ChartSkeleton />, ssr: false },
);
const RecurringSpending = dynamic(
  () => import("@/components/dashboard/recurring-spending").then((m) => ({ default: m.RecurringSpending })),
  { loading: () => <ChartSkeleton />, ssr: false },
);
const CategoryTrends = dynamic(
  () => import("@/components/dashboard/category-trends").then((m) => ({ default: m.CategoryTrends })),
  { loading: () => <ChartSkeleton />, ssr: false },
);
const YoYComparison = dynamic(
  () => import("@/components/dashboard/yoy-comparison").then((m) => ({ default: m.YoYComparison })),
  { loading: () => <ChartSkeleton />, ssr: false },
);
const SpendingByDow = dynamic(
  () => import("@/components/dashboard/spending-by-dow").then((m) => ({ default: m.SpendingByDow })),
  { loading: () => <ChartSkeleton />, ssr: false },
);
const SavingsRate = dynamic(
  () => import("@/components/dashboard/savings-rate").then((m) => ({ default: m.SavingsRate })),
  { loading: () => <ChartSkeleton />, ssr: false },
);

export default function DashboardPage() {
  const {
    month, year, periodResolved, setMonth, setYear,
    summary, velocity, trends, categories,
    topMerchants, categoryComparison, yoyComparison,
    dayOfWeek, savingsRate, categoryTrends, anomalies, recurring,
  } = useDashboardData();

  if (!periodResolved) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
        <SummaryCardsSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <PeriodSelector
          month={month!}
          year={year!}
          onMonthChange={setMonth}
          onYearChange={setYear}
        />
      </div>

      {summary && <SummaryCards data={summary} />}

      {velocity && <SpendingVelocity data={velocity} />}

      <AnomalyCallouts data={anomalies} />

      <div className="grid gap-6 lg:grid-cols-2">
        <IncomeExpenseTrend data={trends} />
        <CategoryBreakdown data={categories} month={month!} year={year!} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TopMerchants data={topMerchants} month={month!} year={year!} />
        <CategoryComparison data={categoryComparison} month={month!} year={year!} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {recurring && <RecurringSpending data={recurring} />}
        <CategoryTrends data={categoryTrends} />
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
