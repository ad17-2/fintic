import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(
  request: NextRequest,
  { params }: Params
): Promise<NextResponse> {
  const { id } = await params;
  const body = await request.json();

  const existing = db
    .select()
    .from(transactions)
    .where(eq(transactions.id, Number(id)))
    .get();

  if (!existing) {
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 404 }
    );
  }

  const updateData: Record<string, unknown> = {
    updatedAt: sql`(datetime('now'))`,
  };

  if (body.date !== undefined) updateData.date = body.date;
  if (body.description !== undefined)
    updateData.description = body.description;
  if (body.amount !== undefined) updateData.amount = body.amount;
  if (body.type !== undefined) updateData.type = body.type;
  if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
  if (body.notes !== undefined) updateData.notes = body.notes;

  db.update(transactions)
    .set(updateData)
    .where(eq(transactions.id, Number(id)))
    .run();

  const updated = db
    .select()
    .from(transactions)
    .where(eq(transactions.id, Number(id)))
    .get();

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: Params
): Promise<NextResponse> {
  const { id } = await params;

  db.delete(transactions).where(eq(transactions.id, Number(id))).run();

  return new NextResponse(null, { status: 204 });
}
