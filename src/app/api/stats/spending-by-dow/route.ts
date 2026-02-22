import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, uploads, categories } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { ALLOC_EXCLUDE_SQL } from "@/db/queries";
import { parseSearchParams, monthYearSchema } from "@/lib/validation";
import { errorResponse } from "@/lib/api-utils";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
        dow: sql<number>`CAST(strftime('%w', ${transactions.date}) AS INTEGER)`,
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
          eq(transactions.type, "debit"),
          sql`(${categories.name} IS NULL OR ${categories.name} NOT IN (${ALLOC_EXCLUDE_SQL}))`
        )
      )
      .groupBy(sql`strftime('%w', ${transactions.date})`)
      .all();

    const dayMap = new Map(result.map((r) => [r.dow, r]));

    const allDays = DAY_LABELS.map((label, i) => ({
      day: label,
      total: dayMap.get(i)?.total ?? 0,
      count: dayMap.get(i)?.count ?? 0,
    }));

    const monToSun = [...allDays.slice(1), allDays[0]];

    return NextResponse.json(monToSun);
  } catch (error) {
    return errorResponse(error, "stats/spending-by-dow");
  }
}
