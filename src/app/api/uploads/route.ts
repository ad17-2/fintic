import { NextResponse } from "next/server";
import { db } from "@/db";
import { uploads } from "@/db/schema";
import { desc } from "drizzle-orm";
import { errorResponse } from "@/lib/api-utils";

export async function GET(): Promise<NextResponse> {
  try {
    const all = db.select().from(uploads).orderBy(desc(uploads.uploadedAt)).all();
    return NextResponse.json(all);
  } catch (error) {
    return errorResponse(error, "uploads");
  }
}
