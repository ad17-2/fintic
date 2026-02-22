import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { uploads, transactions } from "@/db/schema";
import { parseBcaCsv } from "@/lib/csv-parser";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const month = Number(formData.get("month"));
  const year = Number(formData.get("year"));

  if (!file || !month || !year) {
    return NextResponse.json(
      { error: "File, month, and year are required" },
      { status: 400 }
    );
  }

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
      month,
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
}
