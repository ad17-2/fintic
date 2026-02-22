import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, uploads, categories } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { MONTH_ABBREVS } from "@/lib/constants";
import { ALLOC_EXCLUDE_SQL } from "@/db/queries";
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
        expenses: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'debit' AND (${categories.name} IS NULL OR ${categories.name} NOT IN (${ALLOC_EXCLUDE_SQL})) THEN ${transactions.amount} ELSE 0 END), 0)`,
        allocations: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'debit' AND ${categories.name} IN (${ALLOC_EXCLUDE_SQL}) THEN ${transactions.amount} ELSE 0 END), 0)`,
      })
      .from(transactions)
      .innerJoin(uploads, eq(transactions.uploadId, uploads.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(eq(uploads.status, "committed"))
      .groupBy(uploads.year, uploads.month)
      .orderBy(uploads.year, uploads.month)
      .limit(months)
      .all();

    const formatted = result.map((r) => {
      const savings = r.income - r.expenses - r.allocations;
      const savingsRate = r.income > 0 ? (savings / r.income) * 100 : 0;
      return {
        label: `${MONTH_ABBREVS[r.month - 1]} ${r.year}`,
        month: r.month,
        year: r.year,
        income: r.income,
        expenses: r.expenses,
        allocations: r.allocations,
        savings,
        savingsRate: Math.round(savingsRate * 10) / 10,
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    return errorResponse(error, "stats/savings-rate");
  }
}
