import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(
  request: NextRequest,
  { params }: Params
): Promise<NextResponse> {
  const { id } = await params;
  const body = await request.json();

  const existing = db
    .select()
    .from(categories)
    .where(eq(categories.id, Number(id)))
    .get();

  if (!existing) {
    return NextResponse.json(
      { error: "Category not found" },
      { status: 404 }
    );
  }

  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.color !== undefined) updateData.color = body.color;

  db.update(categories)
    .set(updateData)
    .where(eq(categories.id, Number(id)))
    .run();

  const updated = db
    .select()
    .from(categories)
    .where(eq(categories.id, Number(id)))
    .get();

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: Params
): Promise<NextResponse> {
  const { id } = await params;

  const existing = db
    .select()
    .from(categories)
    .where(eq(categories.id, Number(id)))
    .get();

  if (!existing) {
    return NextResponse.json(
      { error: "Category not found" },
      { status: 404 }
    );
  }

  if (existing.isDefault) {
    return NextResponse.json(
      { error: "Cannot delete default category" },
      { status: 400 }
    );
  }

  db.delete(categories).where(eq(categories.id, Number(id))).run();
  return new NextResponse(null, { status: 204 });
}
