import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, uploads, categories } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { ALLOCATION_CATEGORIES } from "@/lib/constants";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const month = Number(searchParams.get("month"));
  const year = Number(searchParams.get("year"));

  if (!month || !year) {
    return NextResponse.json(
      { error: "month and year are required" },
      { status: 400 }
    );
  }

  const allocExclude = sql.raw(
    ALLOCATION_CATEGORIES.map((c) => `'${c}'`).join(",")
  );

  const result = db
    .select({
      totalSpent: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'debit' AND (${categories.name} IS NULL OR ${categories.name} NOT IN (${allocExclude})) THEN ${transactions.amount} ELSE 0 END), 0)`,
      totalIncome: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'credit' THEN ${transactions.amount} ELSE 0 END), 0)`,
      lastDay: sql<number>`MAX(CAST(SUBSTR(${transactions.date}, 9, 2) AS INTEGER))`,
    })
    .from(transactions)
    .innerJoin(uploads, eq(transactions.uploadId, uploads.id))
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(uploads.status, "committed"),
        eq(uploads.month, month),
        eq(uploads.year, year)
      )
    )
    .get();

  const daysInMonth = new Date(year, month, 0).getDate();
  const daysElapsed = result?.lastDay ?? 0;
  const daysRemaining = daysInMonth - daysElapsed;
  const totalSpent = result?.totalSpent ?? 0;
  const totalIncome = result?.totalIncome ?? 0;
  const avgDailySpend = daysElapsed > 0 ? totalSpent / daysElapsed : 0;
  const projectedTotal = daysElapsed > 0 ? avgDailySpend * daysInMonth : 0;
  const budget = totalIncome;
  const budgetRemaining = budget - projectedTotal;
  const pacePercent = budget > 0 ? (projectedTotal / budget) * 100 : 0;

  return NextResponse.json({
    totalSpent,
    avgDailySpend: Math.round(avgDailySpend),
    daysElapsed,
    daysRemaining,
    daysInMonth,
    projectedTotal: Math.round(projectedTotal),
    budget,
    budgetRemaining: Math.round(budgetRemaining),
    pacePercent: Math.round(pacePercent * 10) / 10,
  });
}
