import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, uploads } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { MONTH_ABBREVS } from "@/lib/constants";
import { parseSearchParams, monthsSchema } from "@/lib/validation";
import { errorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const params = parseSearchParams(monthsSchema, request.nextUrl.searchParams);
  if (!params.success) {
    return NextResponse.json(
      { error: params.error.issues[0].message },
      { status: 400 }
    );
  }

  try {
    const { months } = params.data;

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

    const formatted = result.map((r) => ({
      label: `${MONTH_ABBREVS[r.month - 1]} ${r.year}`,
      month: r.month,
      year: r.year,
      income: r.income,
      expense: r.expense,
      net: r.income - r.expense,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    return errorResponse(error, "stats/trends");
  }
}
