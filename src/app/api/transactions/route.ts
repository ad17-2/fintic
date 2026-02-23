import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, uploads, categories } from "@/db/schema";
import { and, eq, like, or, sql, desc, asc, type SQL } from "drizzle-orm";
import { parseSearchParams, transactionFilterSchema } from "@/lib/validation";
import { errorResponse } from "@/lib/api-utils";

function getSortOrder(sortBy: string, sortDir: string): SQL[] {
  const dir = sortDir === "asc" ? asc : desc;
  const columnMap: Record<string, SQL[]> = {
    date: [dir(transactions.date), desc(transactions.id)],
    amount: [dir(transactions.amount), desc(transactions.date)],
    merchant: [dir(transactions.merchant), desc(transactions.date)],
    category: [dir(categories.name), desc(transactions.date)],
  };
  return columnMap[sortBy] ?? [desc(transactions.date), desc(transactions.id)];
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const params = parseSearchParams(transactionFilterSchema, request.nextUrl.searchParams);
  if (!params.success) {
    return NextResponse.json(
      { error: params.error.issues[0].message },
      { status: 400 }
    );
  }

  try {
    const { month, year, categoryId, type, search, page, limit, sortBy, sortDir } = params.data;

    const conditions = [eq(uploads.status, "committed")];

    if (month) conditions.push(eq(uploads.month, month));
    if (year) conditions.push(eq(uploads.year, year));
    if (categoryId) conditions.push(eq(transactions.categoryId, categoryId));
    if (type) conditions.push(eq(transactions.type, type));
    if (search) {
      conditions.push(
        or(
          like(transactions.description, `%${search}%`),
          like(transactions.merchant, `%${search}%`)
        )!
      );
    }

    const totals = db
      .select({
        count: sql<number>`COUNT(*)`,
        totalIncome: sql<number>`SUM(CASE WHEN ${transactions.type} = 'credit' THEN ${transactions.amount} ELSE 0 END)`,
        totalExpenses: sql<number>`SUM(CASE WHEN ${transactions.type} = 'debit' THEN ${transactions.amount} ELSE 0 END)`,
      })
      .from(transactions)
      .innerJoin(uploads, eq(transactions.uploadId, uploads.id))
      .where(and(...conditions))
      .get();

    const rows = db
      .select({
        id: transactions.id,
        date: transactions.date,
        description: transactions.description,
        merchant: transactions.merchant,
        amount: transactions.amount,
        type: transactions.type,
        balance: transactions.balance,
        categoryId: transactions.categoryId,
        categoryName: categories.name,
        categoryColor: categories.color,
        notes: transactions.notes,
      })
      .from(transactions)
      .innerJoin(uploads, eq(transactions.uploadId, uploads.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(...getSortOrder(sortBy, sortDir))
      .limit(limit)
      .offset((page - 1) * limit)
      .all();

    const count = totals?.count ?? 0;

    return NextResponse.json({
      transactions: rows,
      total: count,
      totalIncome: totals?.totalIncome ?? 0,
      totalExpenses: totals?.totalExpenses ?? 0,
      page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    return errorResponse(error, "transactions");
  }
}
