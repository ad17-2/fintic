import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { categoryCreateSchema } from "@/lib/validation";
import { errorResponse } from "@/lib/api-utils";

export async function GET(): Promise<NextResponse> {
  try {
    const all = db.select().from(categories).all();
    return NextResponse.json(all);
  } catch (error) {
    return errorResponse(error, "categories");
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const parsed = categoryCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const [category] = db
      .insert(categories)
      .values({
        name: parsed.data.name,
        color: parsed.data.color,
        isDefault: false,
      })
      .returning()
      .all();

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return errorResponse(error, "categories");
  }
}
