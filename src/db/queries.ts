import { db } from "@/db";
import { transactions, uploads, categories } from "@/db/schema";
import { and, eq, sql, desc } from "drizzle-orm";
import { ALLOCATION_CATEGORIES } from "@/lib/constants";

export const ALLOC_EXCLUDE_SQL = sql.raw(
  ALLOCATION_CATEGORIES.map((c) => `'${c}'`).join(",")
);

export function getCategoryTotals(month: number, year: number) {
  return db
    .select({
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
