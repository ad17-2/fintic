import { NextRequest, NextResponse } from "next/server";
import { getCategoryTotals } from "@/db/queries";
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
  } catch (error) {
    return errorResponse(error, "stats/yoy-comparison");
  }
}
