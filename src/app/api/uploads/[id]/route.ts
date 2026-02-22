import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { uploads, transactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { idParamSchema } from "@/lib/validation";
import { errorResponse } from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  { params }: Params
): Promise<NextResponse> {
  const { id: rawId } = await params;
  const parsed = idParamSchema.safeParse({ id: rawId });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  try {
    const { id } = parsed.data;
    const upload = db
      .select()
      .from(uploads)
      .where(eq(uploads.id, id))
      .get();

    if (!upload) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    const txns = db
      .select()
      .from(transactions)
      .where(eq(transactions.uploadId, id))
      .all();

    return NextResponse.json({ upload, transactions: txns });
  } catch (error) {
    return errorResponse(error, "uploads/[id]");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: Params
): Promise<NextResponse> {
  const { id: rawId } = await params;
  const parsed = idParamSchema.safeParse({ id: rawId });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  try {
    const { id } = parsed.data;
    const upload = db
      .select()
      .from(uploads)
      .where(eq(uploads.id, id))
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

    db.delete(uploads).where(eq(uploads.id, id)).run();
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponse(error, "uploads/[id]");
  }
}
