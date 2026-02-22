import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { uploads } from "@/db/schema";
import { eq } from "drizzle-orm";
import { idParamSchema } from "@/lib/validation";
import { errorResponse } from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

export async function POST(
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
        { error: "Upload already committed" },
        { status: 400 }
      );
    }

    db.update(uploads)
      .set({ status: "committed" })
      .where(eq(uploads.id, id))
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, "uploads/[id]/commit");
  }
}
