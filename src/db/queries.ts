import { db } from "@/db";
import { transactions, uploads, categories } from "@/db/schema";
import { and, eq, sql, desc } from "drizzle-orm";
import { ALLOCATION_CATEGORIES } from "@/lib/constants";

export const ALLOC_EXCLUDE_SQL = sql.raw(
  ALLOCATION_CATEGORIES.map((c) => `'${c}'`).join(",")
);

export function getPriorMonth(month: number, year: number, monthsBack: number): { month: number; year: number } {
  let m = month - monthsBack;
  let y = year;
  while (m <= 0) { m += 12; y--; }
  return { month: m, year: y };
}

export function getCategoryTotalsByRange(
  startMonth: number, startYear: number,
  endMonth: number, endYear: number,
) {
  const startVal = startYear * 100 + startMonth;
  const endVal = endYear * 100 + endMonth;

  return db
    .select({
      month: uploads.month,
      year: uploads.year,
      categoryId: transactions.categoryId,
      categoryName: sql<string>`COALESCE(${categories.name}, 'Uncategorized')`,
      color: sql<string>`COALESCE(${categories.color}, '#D1D5DB')`,
      total: sql<number>`SUM(${transactions.amount})`,
    })
    .from(transactions)
    .innerJoin(uploads, eq(transactions.uploadId, uploads.id))
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(uploads.status, "committed"),
        eq(transactions.type, "debit"),
        sql`(${uploads.year} * 100 + ${uploads.month}) BETWEEN ${startVal} AND ${endVal}`,
        sql`(${categories.name} IS NULL OR ${categories.name} NOT IN (${ALLOC_EXCLUDE_SQL}))`
      )
    )
    .groupBy(uploads.year, uploads.month, transactions.categoryId)
    .orderBy(uploads.year, uploads.month)
    .all();
}

export function getCategoryTotals(month: number, year: number) {
  return db
    .select({
      categoryId: transactions.categoryId,
      categoryName: sql<string>`COALESCE(${categories.name}, 'Uncategorized')`,
      color: sql<string>`COALESCE(${categories.color}, '#D1D5DB')`,
      total: sql<number>`SUM(${transactions.amount})`,
    })
    .from(transactions)
    .innerJoin(uploads, eq(transactions.uploadId, uploads.id))
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(uploads.status, "committed"),
        eq(uploads.month, month),
        eq(uploads.year, year),
        eq(transactions.type, "debit")
      )
    )
    .groupBy(transactions.categoryId)
    .orderBy(desc(sql`SUM(${transactions.amount})`))
    .all();
}
