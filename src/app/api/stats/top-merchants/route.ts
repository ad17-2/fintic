import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, uploads } from "@/db/schema";
import { and, eq, sql, desc, isNotNull } from "drizzle-orm";

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
      merchant: transactions.merchant,
      total: sql<number>`SUM(${transactions.amount})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(transactions)
    .innerJoin(uploads, eq(transactions.uploadId, uploads.id))
    .where(
      and(
        eq(uploads.status, "committed"),
        eq(uploads.month, month),
        eq(uploads.year, year),
        eq(transactions.type, "debit"),
        isNotNull(transactions.merchant)
      )
    )
    .groupBy(transactions.merchant)
    .orderBy(desc(sql`SUM(${transactions.amount})`))
    .limit(10)
    .all();

  return NextResponse.json(result);
}
