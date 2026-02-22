import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, uploads, categories } from "@/db/schema";
import { and, eq, sql, desc } from "drizzle-orm";

function getCategoryTotals(month: number, year: number) {
  return db
    .select({
      categoryName: sql<string>`COALESCE(${categories.name}, 'Uncategorized')`,
      color: sql<string>`COALESCE(${categories.color}, '#D1D5DB')`,
      total: sql<number>`SUM(${transactions.amount})`,
    })
    .from(transactions)
    .innerJoin(uploads, eq(transactions.uploadId, uploads.id))
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(uploads.status, "committed"),
        eq(uploads.month, month),
        eq(uploads.year, year),
        eq(transactions.type, "debit")
      )
    )
    .groupBy(transactions.categoryId)
    .orderBy(desc(sql`SUM(${transactions.amount})`))
    .all();
}

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

  const [current, previousYear] = [
    getCategoryTotals(month, year),
    getCategoryTotals(month, year - 1),
  ];

  const categoryMap = new Map<
    string,
    { category: string; color: string; current: number; previousYear: number }
  >();

  for (const row of current) {
    categoryMap.set(row.categoryName, {
      category: row.categoryName,
      color: row.color,
      current: row.total,
      previousYear: 0,
    });
  }

  for (const row of previousYear) {
    const existing = categoryMap.get(row.categoryName);
    if (existing) {
      existing.previousYear = row.total;
    } else {
      categoryMap.set(row.categoryName, {
        category: row.categoryName,
        color: row.color,
        current: 0,
        previousYear: row.total,
      });
    }
  }

  const result = Array.from(categoryMap.values())
    .map((r) => ({
      ...r,
      changePercent:
        r.previousYear > 0
          ? Math.round(((r.current - r.previousYear) / r.previousYear) * 1000) / 10
          : r.current > 0
            ? 100
            : 0,
    }))
    .sort((a, b) => b.current + b.previousYear - (a.current + a.previousYear));

  return NextResponse.json(result);
}
