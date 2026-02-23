import { NextRequest, NextResponse } from "next/server";
import { getCategoryTotalsByRange, getPriorMonth } from "@/db/queries";
import { parseSearchParams, monthYearSchema } from "@/lib/validation";
import { errorResponse } from "@/lib/api-utils";

const THRESHOLD_PERCENT = 30;
const MIN_AMOUNT = 100000;

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
    const start = getPriorMonth(month, year, 3);
    const rows = getCategoryTotalsByRange(start.month, start.year, month, year);

    const categoryMonths = new Map<string, { color: string; current: number; prior: number[] }>();

    for (const row of rows) {
      if (!categoryMonths.has(row.categoryName)) {
        categoryMonths.set(row.categoryName, { color: row.color, current: 0, prior: [] });
      }
      const entry = categoryMonths.get(row.categoryName)!;
      if (row.month === month && row.year === year) {
        entry.current = row.total;
      } else {
        entry.prior.push(row.total);
      }
    }

    const anomalies = [];

    for (const [categoryName, { color, current, prior }] of categoryMonths) {
      if (prior.length < 2) continue;
      if (current < MIN_AMOUNT) continue;

      const rollingAverage = Math.round(prior.reduce((s, v) => s + v, 0) / prior.length);
      if (rollingAverage === 0) continue;

      const percentAbove = Math.round(((current - rollingAverage) / rollingAverage) * 100);
      if (percentAbove > THRESHOLD_PERCENT) {
        anomalies.push({
          categoryName,
          color,
          currentTotal: current,
          rollingAverage,
          percentAboveAverage: percentAbove,
        });
      }
    }

    anomalies.sort((a, b) => b.percentAboveAverage - a.percentAboveAverage);

    return NextResponse.json(anomalies);
  } catch (error) {
    return errorResponse(error, "stats/anomalies");
  }
}
