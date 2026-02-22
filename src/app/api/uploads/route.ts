import { NextResponse } from "next/server";
import { db } from "@/db";
import { uploads } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET(): Promise<NextResponse> {
  const all = db.select().from(uploads).orderBy(desc(uploads.uploadedAt)).all();
  return NextResponse.json(all);
}
