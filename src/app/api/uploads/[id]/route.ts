import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { uploads, transactions } from "@/db/schema";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function GET(
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

  const txns = db
    .select()
    .from(transactions)
    .where(eq(transactions.uploadId, Number(id)))
    .all();

  return NextResponse.json({ upload, transactions: txns });
}

export async function DELETE(
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
      { error: "Cannot delete committed upload" },
      { status: 400 }
    );
  }

  db.delete(uploads).where(eq(uploads.id, Number(id))).run();
  return new NextResponse(null, { status: 204 });
}
