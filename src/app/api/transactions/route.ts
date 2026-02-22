import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, uploads, categories } from "@/db/schema";
import { and, eq, like, sql, desc } from "drizzle-orm";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const month = searchParams.get("month");
  const year = searchParams.get("year");
  const categoryId = searchParams.get("categoryId");
  const type = searchParams.get("type");
  const search = searchParams.get("search");
  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "50");

  const conditions = [eq(uploads.status, "committed")];

  if (month) conditions.push(eq(uploads.month, Number(month)));
  if (year) conditions.push(eq(uploads.year, Number(year)));
  if (categoryId) conditions.push(eq(transactions.categoryId, Number(categoryId)));
  if (type) conditions.push(eq(transactions.type, type));
  if (search) conditions.push(like(transactions.description, `%${search}%`));

  const total = db
    .select({ count: sql<number>`COUNT(*)` })
    .from(transactions)
    .innerJoin(uploads, eq(transactions.uploadId, uploads.id))
    .where(and(...conditions))
    .get();

  const rows = db
    .select({
      id: transactions.id,
      date: transactions.date,
      description: transactions.description,
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
    .orderBy(desc(transactions.date), desc(transactions.id))
    .limit(limit)
    .offset((page - 1) * limit)
    .all();

  return NextResponse.json({
    transactions: rows,
    total: total?.count ?? 0,
    page,
    totalPages: Math.ceil((total?.count ?? 0) / limit),
  });
}
