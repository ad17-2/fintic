import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { idParamSchema, transactionPatchSchema } from "@/lib/validation";
import { errorResponse } from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(
  request: NextRequest,
  { params }: Params
): Promise<NextResponse> {
  const { id: rawId } = await params;
  const idParsed = idParamSchema.safeParse({ id: rawId });
  if (!idParsed.success) {
    return NextResponse.json(
      { error: idParsed.error.issues[0].message },
      { status: 400 }
    );
  }

  try {
    const { id } = idParsed.data;
    const body = await request.json();
    const parsed = transactionPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const existing = db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
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

    if (parsed.data.date !== undefined) updateData.date = parsed.data.date;
    if (parsed.data.description !== undefined)
      updateData.description = parsed.data.description;
    if (parsed.data.merchant !== undefined) updateData.merchant = parsed.data.merchant;
    if (parsed.data.amount !== undefined) updateData.amount = parsed.data.amount;
    if (parsed.data.type !== undefined) updateData.type = parsed.data.type;
    if (parsed.data.categoryId !== undefined) updateData.categoryId = parsed.data.categoryId;
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;

    db.update(transactions)
      .set(updateData)
      .where(eq(transactions.id, id))
      .run();

    const updated = db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .get();

    return NextResponse.json(updated);
  } catch (error) {
    return errorResponse(error, "transactions/[id]");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: Params
): Promise<NextResponse> {
  const { id: rawId } = await params;
  const idParsed = idParamSchema.safeParse({ id: rawId });
  if (!idParsed.success) {
    return NextResponse.json(
      { error: idParsed.error.issues[0].message },
      { status: 400 }
    );
  }

  try {
    const { id } = idParsed.data;
    db.delete(transactions).where(eq(transactions.id, id)).run();
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponse(error, "transactions/[id]");
  }
}
