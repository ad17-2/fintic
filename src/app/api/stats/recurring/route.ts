import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, uploads } from "@/db/schema";
import { and, eq, sql, isNotNull } from "drizzle-orm";
import { getPriorMonth } from "@/db/queries";
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
    const start = getPriorMonth(month, year, 2);
    const startVal = start.year * 100 + start.month;
    const endVal = year * 100 + month;

    const rows = db
      .select({
        merchant: transactions.merchant,
        month: uploads.month,
        year: uploads.year,
        monthTotal: sql<number>`SUM(${transactions.amount})`,
      })
      .from(transactions)
      .innerJoin(uploads, eq(transactions.uploadId, uploads.id))
      .where(
        and(
          eq(uploads.status, "committed"),
          eq(transactions.type, "debit"),
          isNotNull(transactions.merchant),
          sql`(${uploads.year} * 100 + ${uploads.month}) BETWEEN ${startVal} AND ${endVal}`
        )
      )
      .groupBy(transactions.merchant, uploads.year, uploads.month)
      .all();

    const merchantMonths = new Map<string, { month: number; year: number; total: number }[]>();
    for (const row of rows) {
      if (!row.merchant) continue;
      if (!merchantMonths.has(row.merchant)) merchantMonths.set(row.merchant, []);
      merchantMonths.get(row.merchant)!.push({ month: row.month, year: row.year, total: row.monthTotal });
    }

    const recurringItems = [];
    let recurringTotal = 0;

    for (const [merchant, months] of merchantMonths) {
      if (months.length < 2) continue;

      const amounts = months.map((m) => m.total);
      const min = Math.min(...amounts);
      const max = Math.max(...amounts);
      if (min > 0 && max / min > 1.5) continue;

      const currentMonth = months.find((m) => m.month === month && m.year === year);
      const currentAmount = currentMonth?.total ?? 0;
      const avg = Math.round(amounts.reduce((s, a) => s + a, 0) / amounts.length);

      recurringItems.push({
        merchant,
        averageAmount: avg,
        monthsAppeared: months.length,
        currentMonthAmount: currentAmount,
      });
      recurringTotal += currentAmount;
    }

    recurringItems.sort((a, b) => b.currentMonthAmount - a.currentMonthAmount);

    const totalDebitRes = db
      .select({ total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)` })
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
      .get();

    const totalDebit = totalDebitRes?.total ?? 0;

    return NextResponse.json({
      recurring: recurringTotal,
      oneTime: Math.max(0, totalDebit - recurringTotal),
      recurringItems: recurringItems.slice(0, 10),
    });
  } catch (error) {
    return errorResponse(error, "stats/recurring");
  }
}
