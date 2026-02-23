import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { execSync } from "child_process";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import type { ParseResult } from "./csv-parser";

const client = new Anthropic();

const CATEGORIZATION_SYSTEM = `You categorize Indonesian bank (BCA) transactions. Available categories:
1: Investing — mutual funds, stocks, Bibit, investment apps
2: Tithe — church offerings ("persembahan"), religious donations
3: Family — transfers to family members
4: Food & Dining — restaurants, cafes, bakeries, food delivery, groceries
5: Health — hospitals, clinics, pharmacies, Halodoc, health apps
6: Personal Items — parking, personal purchases, small personal expenses
7: Education — courses, books, tuition, learning platforms
8: Salary — payroll deposits from employers
9: Transfer — bank transfers, self-transfers, person-to-person, payment collections, BCA card payments
10: Fees & Admin — bank admin fees, transfer fees, interest tax
11: Bills & Utilities — electricity, water, internet, insurance, courier services
12: Shopping — e-commerce (Tokopedia, Shopee), retail stores, travel bookings (Traveloka), online services
13: Uncategorized — only if genuinely unclassifiable

Rules:
- Credit transactions from employers/companies → 8 (Salary)
- Credit transfers from individuals → 9 (Transfer)
- Bank interest → 9 (Transfer)
- Use 13 only as last resort`;

const batchResultSchema = z.object({
  results: z.array(
    z.object({
      index: z.number().describe("Transaction index from the input list"),
      categoryId: z
        .number()
        .min(1)
        .max(13)
        .describe("Category ID from the available categories"),
    })
  ),
});

const pdfTransactionSchema = z.object({
  date: z.string().describe("Date in YYYY-MM-DD format"),
  description: z.string().describe("Full transaction description"),
  merchant: z.string().describe("Extracted merchant or counterparty name"),
  branch: z.string().describe("Branch code if available, empty string otherwise"),
  amount: z.number().describe("Transaction amount (positive number)"),
  type: z.enum(["debit", "credit"]).describe("DB = debit, CR = credit"),
  balance: z.number().describe("Running balance after transaction"),
  categoryId: z
    .number()
    .min(1)
    .max(13)
    .describe("Category ID from the available categories"),
});

const pdfResultSchema = z.object({
  month: z.number().min(1).max(12).describe("Statement month"),
  openingBalance: z.number().describe("Opening balance (Saldo Awal)"),
  closingBalance: z.number().describe("Closing balance (Saldo Akhir)"),
  totalCredit: z.number().describe("Total credit transactions"),
  totalDebit: z.number().describe("Total debit transactions"),
  transactions: z.array(pdfTransactionSchema),
});

type PdfResult = z.infer<typeof pdfResultSchema>;

function stripSchemaField(schema: Record<string, unknown>): Record<string, unknown> {
  const { $schema, ...rest } = schema;
  return rest;
}

export async function llmCategorizeBatch(
  transactions: { index: number; merchant: string; description: string; type: string; amount: number }[],
  categories: { id: number; name: string }[]
): Promise<Map<number, number>> {
  if (transactions.length === 0) return new Map();

  try {
    const numbered = transactions
      .map((t) => `${t.index}: [${t.type}] ${t.merchant || "unknown"} — "${t.description}" — Rp ${t.amount.toLocaleString("id-ID")}`)
      .join("\n");

    const categoryList = categories.map((c) => `${c.id}: ${c.name}`).join(", ");

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: CATEGORIZATION_SYSTEM,
      tools: [
        {
          name: "categorize_transactions",
          description: "Assign a category ID to each transaction",
          input_schema: stripSchemaField(
            z.toJSONSchema(batchResultSchema)
          ) as Anthropic.Tool["input_schema"],
        },
      ],
      tool_choice: { type: "tool", name: "categorize_transactions" },
      messages: [
        {
          role: "user",
          content: `Categorize each transaction. Available categories: ${categoryList}\n\nTransactions:\n${numbered}`,
        },
      ],
    });

    const toolUse = response.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") return new Map();

    const parsed = batchResultSchema.parse(toolUse.input);
    const result = new Map<number, number>();
    for (const r of parsed.results) {
      if (r.categoryId >= 1 && r.categoryId <= 13) {
        result.set(r.index, r.categoryId);
      }
    }
    return result;
  } catch (error) {
    console.error("[llm] categorization failed:", error instanceof Error ? error.message : error);
    return new Map();
  }
}

export function extractPdfText(pdfBuffer: Buffer): string {
  const tmpPath = join(tmpdir(), `fintic-${Date.now()}.pdf`);
  try {
    writeFileSync(tmpPath, pdfBuffer);
    return execSync(`pdftotext -layout "${tmpPath}" -`, {
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
    });
  } finally {
    try { unlinkSync(tmpPath); } catch {}
  }
}

export async function llmExtractPdf(
  rawText: string,
  year: number,
  categories: { id: number; name: string }[]
): Promise<ParseResult & { categoryIds: (number | null)[] }> {
  const categoryList = categories.map((c) => `${c.id}: ${c.name}`).join(", ");

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 16384,
    system: `You extract structured transaction data from Indonesian BCA bank statements.

${CATEGORIZATION_SYSTEM}

Extraction rules:
- Dates: convert DD/MM to ${year}-MM-DD format
- Amounts: always positive numbers, use "type" field for debit/credit
- "DB" suffix = debit, no suffix or "CR" = credit
- Merchant: extract the meaningful counterparty name (not bank codes)
  - QR payments: merchant name follows "00000.00"
  - FTSCY transfers: counterparty name is in continuation lines
  - FTFVA transfers: merchant follows the VA number pattern (e.g., 80777/TOKOPEDIA → TOKOPEDIA)
  - BI-FAST: counterparty after "TRANSFER KE/DR XXX"
- Balance: running balance shown at end of each transaction line
- Assign categoryId for each transaction based on the categorization rules above`,
    tools: [
      {
        name: "extract_statement",
        description: "Extract all transactions and metadata from a BCA bank statement",
        input_schema: stripSchemaField(
          z.toJSONSchema(pdfResultSchema)
        ) as Anthropic.Tool["input_schema"],
      },
    ],
    tool_choice: { type: "tool", name: "extract_statement" },
    messages: [
      {
        role: "user",
        content: `Extract all transactions from this BCA bank statement (year: ${year}). Categories: ${categoryList}\n\n${rawText}`,
      },
    ],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("LLM did not return structured data");
  }

  const parsed: PdfResult = pdfResultSchema.parse(toolUse.input);

  const categoryIds = parsed.transactions.map((t) => t.categoryId ?? null);
  const transactions = parsed.transactions.map((t) => ({
    date: t.date,
    description: t.description,
    merchant: t.merchant,
    branch: t.branch,
    amount: t.amount,
    type: t.type as "debit" | "credit",
    balance: t.balance,
  }));

  return {
    accountNumber: "",
    accountName: "",
    currency: "IDR",
    month: parsed.month,
    transactions,
    openingBalance: parsed.openingBalance,
    closingBalance: parsed.closingBalance,
    totalCredit: parsed.totalCredit,
    totalDebit: parsed.totalDebit,
    categoryIds,
  };
}
