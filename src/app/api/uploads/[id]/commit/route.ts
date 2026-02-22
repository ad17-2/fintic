import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { uploads } from "@/db/schema";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function POST(
  _request: NextRequest,
  { params }: Params
): Promise<NextResponse> {
  const { id } = await params;
  const upload = db
    .select()
    .from(uploads)
    .where(eq(uploads.id, Number(id)))
    .get();

  if (!upload) {
    return NextResponse.json({ error: "Upload not found" }, { status: 404 });
  }

  if (upload.status === "committed") {
    return NextResponse.json(
      { error: "Upload already committed" },
      { status: 400 }
    );
  }

  db.update(uploads)
    .set({ status: "committed" })
    .where(eq(uploads.id, Number(id)))
    .run();

  return NextResponse.json({ success: true });
}
