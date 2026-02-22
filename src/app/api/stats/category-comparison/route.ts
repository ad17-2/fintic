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

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  const [current, previous] = [
    getCategoryTotals(month, year),
    getCategoryTotals(prevMonth, prevYear),
  ];

  const categoryMap = new Map<
    string,
    { category: string; color: string; current: number; previous: number }
  >();

  for (const row of current) {
    categoryMap.set(row.categoryName, {
      category: row.categoryName,
      color: row.color,
      current: row.total,
      previous: 0,
    });
  }

  for (const row of previous) {
    const existing = categoryMap.get(row.categoryName);
    if (existing) {
      existing.previous = row.total;
    } else {
      categoryMap.set(row.categoryName, {
        category: row.categoryName,
        color: row.color,
        current: 0,
        previous: row.total,
      });
    }
  }

  const result = Array.from(categoryMap.values()).sort(
    (a, b) => b.current + b.previous - (a.current + a.previous)
  );

  return NextResponse.json(result);
}
