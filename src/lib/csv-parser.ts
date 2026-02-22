export interface ParsedTransaction {
  date: string;
  description: string;
  branch: string;
  amount: number;
  type: "debit" | "credit";
  balance: number;
}

export interface ParseResult {
  accountNumber: string;
  accountName: string;
  currency: string;
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

  const { openingBalance, closingBalance, totalCredit, totalDebit } =
    parseFooter(footer);

  return {
    accountNumber,
    accountName,
    currency,
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

  return { date, description, branch, amount, type, balance };
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
