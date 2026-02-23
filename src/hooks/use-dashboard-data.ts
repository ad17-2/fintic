"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  SummaryData,
  CategoryData,
  TrendData,
  MerchantData,
  ComparisonData,
  VelocityData,
  YoYItem,
  DowItem,
  SavingsRateItem,
  CategoryTrendItem,
  AnomalyItem,
  RecurringData,
} from "@/lib/types";

interface DashboardData {
  month: string | null;
  year: string | null;
  periodResolved: boolean;
  setMonth: (m: string) => void;
  setYear: (y: string) => void;
  summary: SummaryData | null;
  categories: CategoryData[];
  trends: TrendData[];
  topMerchants: MerchantData[];
  categoryComparison: ComparisonData[];
  velocity: VelocityData | null;
  yoyComparison: YoYItem[];
  dayOfWeek: DowItem[];
  savingsRate: SavingsRateItem[];
  categoryTrends: CategoryTrendItem[];
  anomalies: AnomalyItem[];
  recurring: RecurringData | null;
}

export function useDashboardData(): DashboardData {
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
  const [categoryTrends, setCategoryTrends] = useState<CategoryTrendItem[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyItem[]>([]);
  const [recurring, setRecurring] = useState<RecurringData | null>(null);

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
      categoryTrendsRes, anomaliesRes, recurringRes,
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
      fetch(`/api/stats/category-trends?month=${month}&year=${year}`),
      fetch(`/api/stats/anomalies?month=${month}&year=${year}`),
      fetch(`/api/stats/recurring?month=${month}&year=${year}`),
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
    if (categoryTrendsRes.ok) setCategoryTrends(await categoryTrendsRes.json());
    if (anomaliesRes.ok) setAnomalies(await anomaliesRes.json());
    if (recurringRes.ok) setRecurring(await recurringRes.json());
  }, [month, year]);

  useEffect(() => {
    if (periodResolved) fetchData();
  }, [periodResolved, fetchData]);

  return {
    month, year, periodResolved,
    setMonth, setYear,
    summary, categories, trends, topMerchants,
    categoryComparison, velocity, yoyComparison, dayOfWeek, savingsRate,
    categoryTrends, anomalies, recurring,
  };
}
