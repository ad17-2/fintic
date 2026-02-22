import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { uploads, transactions } from "@/db/schema";
import { parseBcaCsv } from "@/lib/csv-parser";
import { errorResponse } from "@/lib/api-utils";

const yearSchema = z.coerce.number().int().min(2000).max(2100);

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const rawYear = formData.get("year");

    if (!file) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      );
    }

    const yearParsed = yearSchema.safeParse(rawYear);
    if (!yearParsed.success) {
      return NextResponse.json(
        { error: yearParsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const year = yearParsed.data;
    const csvText = await file.text();
    const result = parseBcaCsv(csvText, year);

    if (result.transactions.length === 0) {
      return NextResponse.json(
        { error: "No transactions found in CSV" },
        { status: 400 }
      );
    }

    const [upload] = db
      .insert(uploads)
      .values({
        filename: file.name,
        month: result.month,
        year,
        openingBalance: result.openingBalance,
        closingBalance: result.closingBalance,
        totalCredit: result.totalCredit,
        totalDebit: result.totalDebit,
        transactionCount: result.transactions.length,
        status: "pending",
      })
      .returning()
      .all();

    const transactionValues = result.transactions.map((t) => ({
      uploadId: upload.id,
      date: t.date,
      description: t.description,
      merchant: t.merchant,
      branch: t.branch,
      amount: t.amount,
      type: t.type,
      balance: t.balance,
    }));

    db.insert(transactions).values(transactionValues).run();

    return NextResponse.json({
      uploadId: upload.id,
      transactionCount: result.transactions.length,
    });
  } catch (error) {
    return errorResponse(error, "upload");
  }
}
