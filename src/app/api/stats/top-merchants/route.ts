import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, uploads } from "@/db/schema";
import { and, eq, sql, desc, isNotNull } from "drizzle-orm";
import { parseSearchParams, monthYearSchema } from "@/lib/validation";
import { errorResponse } from "@/lib/api-utils";

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
  } catch (error) {
    return errorResponse(error, "stats/top-merchants");
  }
}
