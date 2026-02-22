import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, uploads, categories } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { ALLOC_EXCLUDE_SQL } from "@/db/queries";
import { parseSearchParams, monthYearSchema } from "@/lib/validation";
import { errorResponse } from "@/lib/api-utils";

function getMonthTotals(month: number, year: number) {
  return db
    .select({
      totalIncome: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'credit' THEN ${transactions.amount} ELSE 0 END), 0)`,
      totalExpenses: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'debit' AND (${categories.name} IS NULL OR ${categories.name} NOT IN (${ALLOC_EXCLUDE_SQL})) THEN ${transactions.amount} ELSE 0 END), 0)`,
      allocations: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'debit' AND ${categories.name} IN (${ALLOC_EXCLUDE_SQL}) THEN ${transactions.amount} ELSE 0 END), 0)`,
      transactionCount: sql<number>`COUNT(*)`,
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
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const params = parseSearchParams(monthYearSchema, request.nextUrl.searchParams);
  if (!params.success) {
    return NextResponse.json(
      { error: params.error.issues[0].message },
      { status: 400 }
    );
  }

  try {
    const { month, year } = params.data;
    const result = getMonthTotals(month, year);

    const lastUpload = db
      .select({
        closingBalance: uploads.closingBalance,
      })
      .from(uploads)
      .where(
        and(
          eq(uploads.status, "committed"),
          eq(uploads.month, month),
          eq(uploads.year, year)
        )
      )
      .get();

    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevResult = getMonthTotals(prevMonth, prevYear);

    const totalIncome = result?.totalIncome ?? 0;
    const totalExpenses = result?.totalExpenses ?? 0;
    const allocations = result?.allocations ?? 0;
    const net = totalIncome - totalExpenses - allocations;
    const balance = lastUpload?.closingBalance ?? 0;

    const prevIncome = prevResult?.totalIncome ?? 0;
    const prevExpenses = prevResult?.totalExpenses ?? 0;
    const prevAllocations = prevResult?.allocations ?? 0;

    const incomeChange = prevIncome > 0 ? ((totalIncome - prevIncome) / prevIncome) * 100 : 0;
    const expenseChange = prevExpenses > 0 ? ((totalExpenses - prevExpenses) / prevExpenses) * 100 : 0;
    const allocationChange = prevAllocations > 0 ? ((allocations - prevAllocations) / prevAllocations) * 100 : 0;

    const dailySpending = db
      .select({
        day: sql<number>`CAST(SUBSTR(${transactions.date}, 9, 2) AS INTEGER)`,
        amount: sql<number>`SUM(${transactions.amount})`,
      })
      .from(transactions)
      .innerJoin(uploads, eq(transactions.uploadId, uploads.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          eq(uploads.status, "committed"),
          eq(uploads.month, month),
          eq(uploads.year, year),
          eq(transactions.type, "debit"),
          sql`(${categories.name} IS NULL OR ${categories.name} NOT IN (${ALLOC_EXCLUDE_SQL}))`
        )
      )
      .groupBy(sql`SUBSTR(${transactions.date}, 9, 2)`)
      .all();

    return NextResponse.json({
      totalIncome,
      totalExpenses,
      allocations,
      net,
      balance,
      incomeChange,
      expenseChange,
      allocationChange,
      transactionCount: result?.transactionCount ?? 0,
      dailySpending,
    });
  } catch (error) {
    return errorResponse(error, "stats/summary");
  }
}
