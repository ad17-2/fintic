import { NextRequest, NextResponse } from "next/server";
import { getCategoryTotalsByRange, getPriorMonth } from "@/db/queries";
import { parseSearchParams, monthYearSchema } from "@/lib/validation";
import { errorResponse } from "@/lib/api-utils";
import { MONTH_ABBREVS } from "@/lib/constants";

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
    const start = getPriorMonth(month, year, 5);
    const rows = getCategoryTotalsByRange(start.month, start.year, month, year);

    const allMonths: { month: number; year: number }[] = [];
    let m = start.month;
    let y = start.year;
    for (let i = 0; i < 6; i++) {
      allMonths.push({ month: m, year: y });
      m++;
      if (m > 12) { m = 1; y++; }
    }

    const categoryMap = new Map<string, { color: string; monthTotals: Map<string, number> }>();

    for (const row of rows) {
      const key = `${row.year}-${row.month}`;
      if (!categoryMap.has(row.categoryName)) {
        categoryMap.set(row.categoryName, { color: row.color, monthTotals: new Map() });
      }
      categoryMap.get(row.categoryName)!.monthTotals.set(key, row.total);
    }

    const result = Array.from(categoryMap.entries())
      .map(([categoryName, { color, monthTotals }]) => ({
        categoryName,
        color,
        grandTotal: Array.from(monthTotals.values()).reduce((s, v) => s + v, 0),
        months: allMonths.map((p) => ({
          month: p.month,
          year: p.year,
          label: MONTH_ABBREVS[p.month - 1],
          total: monthTotals.get(`${p.year}-${p.month}`) ?? 0,
        })),
      }))
      .sort((a, b) => b.grandTotal - a.grandTotal)
      .slice(0, 8)
      .map(({ grandTotal: _, ...rest }) => rest);

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error, "stats/category-trends");
  }
}
