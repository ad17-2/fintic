import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { idParamSchema, categoryPatchSchema } from "@/lib/validation";
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
    const parsed = categoryPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const existing = db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .get();

    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.color !== undefined) updateData.color = parsed.data.color;

    db.update(categories)
      .set(updateData)
      .where(eq(categories.id, id))
      .run();

    const updated = db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .get();

    return NextResponse.json(updated);
  } catch (error) {
    return errorResponse(error, "categories/[id]");
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
    const existing = db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
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

    db.delete(categories).where(eq(categories.id, id)).run();
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponse(error, "categories/[id]");
  }
}
