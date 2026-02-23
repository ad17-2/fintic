import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { uploads, transactions, categories } from "@/db/schema";
import { parseBcaCsv, type ParseResult } from "@/lib/csv-parser";
import { llmCategorizeBatch, llmExtractPdf, extractPdfText } from "@/lib/llm";
import { errorResponse } from "@/lib/api-utils";

const yearSchema = z.coerce.number().int().min(2000).max(2100);

function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

function loadCategories(): { id: number; name: string }[] {
  return db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .all();
}

async function handleCsv(file: File, year: number): Promise<ParseResult> {
  const csvText = await file.text();
  return parseBcaCsv(csvText, year);
}

async function handlePdf(
  file: File,
  year: number,
  cats: { id: number; name: string }[]
): Promise<ParseResult & { categoryIds?: (number | null)[] }> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const rawText = extractPdfText(buffer);
  return llmExtractPdf(rawText, year, cats);
}

function insertUpload(file: File, result: ParseResult, year: number) {
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
  return upload;
}

function insertTransactions(
  uploadId: number,
  result: ParseResult,
  categoryIds?: (number | null)[]
): number[] {
  const values = result.transactions.map((t, i) => ({
    uploadId,
    date: t.date,
    description: t.description,
    merchant: t.merchant,
    branch: t.branch,
    amount: t.amount,
    type: t.type,
    balance: t.balance,
    categoryId: categoryIds?.[i] ?? null,
  }));

  const rows = db.insert(transactions).values(values).returning({ id: transactions.id }).all();
  return rows.map((r) => r.id);
}

async function categorizeMissing(
  uploadId: number,
  txnIds: number[],
  result: ParseResult,
  existingCategoryIds: (number | null)[] | undefined,
  cats: { id: number; name: string }[]
): Promise<void> {
  const uncategorized: { index: number; merchant: string; description: string; type: string; amount: number }[] = [];

  for (let i = 0; i < result.transactions.length; i++) {
    if (existingCategoryIds?.[i]) continue;
    const t = result.transactions[i];
    uncategorized.push({
      index: i,
      merchant: t.merchant,
      description: t.description,
      type: t.type,
      amount: t.amount,
    });
  }

  if (uncategorized.length === 0) return;

  const mapping = await llmCategorizeBatch(uncategorized, cats);
  if (mapping.size === 0) return;

  for (const [idx, categoryId] of mapping) {
    const txnId = txnIds[idx];
    if (txnId && categoryId) {
      db.update(transactions)
        .set({ categoryId })
        .where(eq(transactions.id, txnId))
        .run();
    }
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const rawYear = formData.get("year");

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const ext = getFileExtension(file.name);
    if (ext !== "csv" && ext !== "pdf") {
      return NextResponse.json(
        { error: "Only CSV and PDF files are supported" },
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
    const cats = loadCategories();

    let result: ParseResult;
    let categoryIds: (number | null)[] | undefined;

    if (ext === "pdf") {
      const pdfResult = await handlePdf(file, year, cats);
      result = pdfResult;
      categoryIds = pdfResult.categoryIds;
    } else {
      result = await handleCsv(file, year);
    }

    if (result.transactions.length === 0) {
      return NextResponse.json(
        { error: "No transactions found in file" },
        { status: 400 }
      );
    }

    const upload = insertUpload(file, result, year);
    const txnIds = insertTransactions(upload.id, result, categoryIds);

    await categorizeMissing(upload.id, txnIds, result, categoryIds, cats);

    return NextResponse.json({
      uploadId: upload.id,
      transactionCount: result.transactions.length,
    });
  } catch (error) {
    return errorResponse(error, "upload");
  }
}
