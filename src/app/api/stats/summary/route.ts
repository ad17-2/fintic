import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, uploads } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

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

  const result = db
    .select({
      totalIncome: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'credit' THEN ${transactions.amount} ELSE 0 END), 0)`,
      totalExpenses: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'debit' THEN ${transactions.amount} ELSE 0 END), 0)`,
      transactionCount: sql<number>`COUNT(*)`,
    })
    .from(transactions)
    .innerJoin(uploads, eq(transactions.uploadId, uploads.id))
    .where(
      and(
        eq(uploads.status, "committed"),
        eq(uploads.month, month),
        eq(uploads.year, year)
      )
    )
    .get();

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

  const prevResult = db
    .select({
      totalIncome: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'credit' THEN ${transactions.amount} ELSE 0 END), 0)`,
      totalExpenses: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'debit' THEN ${transactions.amount} ELSE 0 END), 0)`,
    })
    .from(transactions)
    .innerJoin(uploads, eq(transactions.uploadId, uploads.id))
    .where(
      and(
        eq(uploads.status, "committed"),
        eq(uploads.month, prevMonth),
        eq(uploads.year, prevYear)
      )
    )
    .get();

  const totalIncome = result?.totalIncome ?? 0;
  const totalExpenses = result?.totalExpenses ?? 0;
  const net = totalIncome - totalExpenses;
  const balance = lastUpload?.closingBalance ?? 0;

  const prevIncome = prevResult?.totalIncome ?? 0;
  const prevExpenses = prevResult?.totalExpenses ?? 0;

  const incomeChange = prevIncome > 0 ? ((totalIncome - prevIncome) / prevIncome) * 100 : 0;
  const expenseChange = prevExpenses > 0 ? ((totalExpenses - prevExpenses) / prevExpenses) * 100 : 0;

  const dailySpending = db
    .select({
      day: sql<number>`CAST(SUBSTR(${transactions.date}, 9, 2) AS INTEGER)`,
      amount: sql<number>`SUM(${transactions.amount})`,
    })
    .from(transactions)
    .innerJoin(uploads, eq(transactions.uploadId, uploads.id))
    .where(
      and(
        eq(uploads.status, "committed"),
        eq(uploads.month, month),
        eq(uploads.year, year),
        eq(transactions.type, "debit")
      )
    )
    .groupBy(sql`SUBSTR(${transactions.date}, 9, 2)`)
    .all();

  return NextResponse.json({
    totalIncome,
    totalExpenses,
    net,
    balance,
    incomeChange,
    expenseChange,
    transactionCount: result?.transactionCount ?? 0,
    dailySpending,
  });
}
