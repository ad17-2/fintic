export interface ParsedTransaction {
  date: string;
  description: string;
  merchant: string;
  branch: string;
  amount: number;
  type: "debit" | "credit";
  balance: number;
}

export interface ParseResult {
  accountNumber: string;
  accountName: string;
  currency: string;
  month: number;
  transactions: ParsedTransaction[];
  openingBalance: number;
  closingBalance: number;
  totalCredit: number;
  totalDebit: number;
}

export function parseBcaCsv(csvText: string, year: number): ParseResult {
  const lines = csvText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const { metadata, transactionLines, footer } = splitSections(lines);

  const accountNumber = extractMetadataValue(metadata[0]);
  const accountName = extractMetadataValue(metadata[1]);
  const currency = extractMetadataValue(metadata[2]);

  const transactions = transactionLines.map((line) =>
    parseTransactionLine(line, year)
  );

  const month = transactions.length > 0
    ? parseInt(transactions[0].date.split("-")[1], 10)
    : new Date().getMonth() + 1;

  const { openingBalance, closingBalance, totalCredit, totalDebit } =
    parseFooter(footer);

  return {
    accountNumber,
    accountName,
    currency,
    month,
    transactions,
    openingBalance,
    closingBalance,
    totalCredit,
    totalDebit,
  };
}

function splitSections(lines: string[]): {
  metadata: string[];
  transactionLines: string[];
  footer: string[];
} {
  const metadata = lines.slice(0, 3);

  const headerIndex = lines.findIndex((l) => l.startsWith("Tanggal,"));

  const footerIndex = lines.findIndex((l) => l.startsWith("Saldo Awal"));

  const transactionLines = lines.slice(
    headerIndex + 1,
    footerIndex > 0 ? footerIndex : lines.length
  );

  const footer = footerIndex > 0 ? lines.slice(footerIndex) : [];

  return { metadata, transactionLines, footer };
}

function extractMetadataValue(line: string): string {
  const parts = line.split(",=,");
  if (parts.length < 2) return "";
  return parts[1].replace(/^'/, "").trim();
}

function parseTransactionLine(
  line: string,
  year: number
): ParsedTransaction {
  const parts = line.split(",");

  const balance = parseFloat(parts[parts.length - 1]);
  const typeRaw = parts[parts.length - 2].trim();
  const type: "debit" | "credit" = typeRaw === "DB" ? "debit" : "credit";
  const amount = parseFloat(parts[parts.length - 3]);
  const branch = parts[parts.length - 4].replace(/^'/, "").trim();

  const dateStr = parts[0].replace(/^'/, "");
  const [day, month] = dateStr.split("/").map(Number);
  const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const description = parts
    .slice(1, parts.length - 4)
    .join(",")
    .trim();

  const merchant = extractMerchant(description);

  return { date, description, merchant, branch, amount, type, balance };
}

function extractMerchant(description: string): string {
  const qrMatch = description.match(
    /QRC?\s+\d{3}\s+[\d.]+(.+)/
  );
  if (qrMatch) return qrMatch[1].trim();

  const ftfvaMatch = description.match(
    /FTFVA\/WS\d+\/([A-Za-z][A-Za-z0-9. ]+)/
  );
  if (ftfvaMatch) return ftfvaMatch[1].replace(/\s*\d{5,}$/, "").trim();

  const ftscyMatch = description.match(
    /FTSCY\/WS\d+\s+[\d.]+(.+)/
  );
  if (ftscyMatch) {
    const raw = ftscyMatch[1].trim();
    const segments = raw.split(/\s{2,}/);
    return segments[segments.length - 1].trim();
  }

  const autocrMatch = description.match(
    /AUTOCR-IR\s+(.+?)(?:\s+USD)/
  );
  if (autocrMatch) return autocrMatch[1].trim();

  const biFastCrMatch = description.match(
    /BI-FAST\s+CR\s+TRANSFER\s+DR\s+\d{3}\s+(.+)/
  );
  if (biFastCrMatch) return biFastCrMatch[1].trim();

  const biFastDbMatch = description.match(
    /BI-FAST\s+DB\s+TRANSFER\s+KE\s+\d{3}\s+(.+)/
  );
  if (biFastDbMatch) return biFastDbMatch[1].replace(/\s{2,}.*$/, "").trim();

  if (description.match(/BI-FAST\s+DB\s+BIAYA\s+TXN/)) return "Transfer Fee";

  const debitDomMatch = description.match(
    /DB\s+DEBIT\s+DOMESTIK.*?\d{3}\s+(.+)/
  );
  if (debitDomMatch) return debitDomMatch[1].trim();

  const kartuDebitMatch = description.match(
    /KARTU\s+DEBIT\s+(.+)/
  );
  if (kartuDebitMatch) return kartuDebitMatch[1].trim();

  if (description.includes("KARTU KREDIT")) return "BCA Card Payment";
  if (description.startsWith("BIAYA ADM")) return "BCA Admin Fee";
  if (description.startsWith("TARIKAN PEMINDAHAN")) return "BCA Transfer";
  if (description === "BUNGA") return "Interest";
  if (description === "PAJAK BUNGA") return "Interest Tax";

  return description.replace(/\s{2,}/g, " ").trim();
}

function parseFooter(footerLines: string[]): {
  openingBalance: number;
  closingBalance: number;
  totalCredit: number;
  totalDebit: number;
} {
  let openingBalance = 0;
  let closingBalance = 0;
  let totalCredit = 0;
  let totalDebit = 0;

  for (const line of footerLines) {
    const value = parseFooterValue(line);
    if (line.startsWith("Saldo Awal")) openingBalance = value;
    else if (line.startsWith("Kredit")) totalCredit = value;
    else if (line.startsWith("Debet")) totalDebit = value;
    else if (line.startsWith("Saldo Akhir")) closingBalance = value;
  }

  return { openingBalance, closingBalance, totalCredit, totalDebit };
}

function parseFooterValue(line: string): number {
  const parts = line.split(",=,");
  if (parts.length < 2) return 0;
  return parseFloat(parts[1].replace(/,/g, ""));
}
