import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, uploads, categories } from "@/db/schema";
import { and, eq, sql, desc } from "drizzle-orm";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const month = Number(searchParams.get("month"));
  const year = Number(searchParams.get("year"));
  const type = searchParams.get("type") || "debit";

  if (!month || !year) {
    return NextResponse.json(
      { error: "month and year are required" },
      { status: 400 }
    );
  }

  const result = db
    .select({
      categoryId: transactions.categoryId,
      categoryName: sql<string>`COALESCE(${categories.name}, 'Uncategorized')`,
      color: sql<string>`COALESCE(${categories.color}, '#D1D5DB')`,
      total: sql<number>`SUM(${transactions.amount})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(transactions)
    .innerJoin(uploads, eq(transactions.uploadId, uploads.id))
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(uploads.status, "committed"),
        eq(uploads.month, month),
        eq(uploads.year, year),
        eq(transactions.type, type)
      )
    )
    .groupBy(transactions.categoryId)
    .orderBy(desc(sql`SUM(${transactions.amount})`))
    .all();

  const grandTotal = result.reduce((sum, r) => sum + r.total, 0);

  const withPercentage = result.map((r) => ({
    ...r,
    percentage: grandTotal > 0 ? (r.total / grandTotal) * 100 : 0,
  }));

  return NextResponse.json(withPercentage);
}
