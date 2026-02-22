import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, uploads } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const months = Number(searchParams.get("months") || "12");

  const result = db
    .select({
      month: uploads.month,
      year: uploads.year,
      income: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'credit' THEN ${transactions.amount} ELSE 0 END), 0)`,
      expense: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'debit' THEN ${transactions.amount} ELSE 0 END), 0)`,
    })
    .from(transactions)
    .innerJoin(uploads, eq(transactions.uploadId, uploads.id))
    .where(eq(uploads.status, "committed"))
    .groupBy(uploads.year, uploads.month)
    .orderBy(uploads.year, uploads.month)
    .limit(months)
    .all();

  const MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const formatted = result.map((r) => ({
    label: `${MONTH_NAMES[r.month - 1]} ${r.year}`,
    month: r.month,
    year: r.year,
    income: r.income,
    expense: r.expense,
    net: r.income - r.expense,
  }));

  return NextResponse.json(formatted);
}
