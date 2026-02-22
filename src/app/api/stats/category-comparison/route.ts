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
  } catch (error) {
    return errorResponse(error, "stats/category-comparison");
  }
}
