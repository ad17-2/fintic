import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";

export async function GET(): Promise<NextResponse> {
  const all = db.select().from(categories).all();
  return NextResponse.json(all);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();

  if (!body.name || !body.color) {
    return NextResponse.json(
      { error: "Name and color are required" },
      { status: 400 }
    );
  }

  const [category] = db
    .insert(categories)
    .values({
      name: body.name,
      color: body.color,
      isDefault: false,
    })
    .returning()
    .all();

  return NextResponse.json(category, { status: 201 });
}
