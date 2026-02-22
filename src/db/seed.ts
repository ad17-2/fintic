import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { categories } from "./schema";

const DEFAULT_CATEGORIES = [
  { name: "Investing", color: "#10B981", isDefault: true },
  { name: "Tithe", color: "#8B5CF6", isDefault: true },
  { name: "Family", color: "#F59E0B", isDefault: true },
  { name: "Food", color: "#EF4444", isDefault: true },
  { name: "Health", color: "#EC4899", isDefault: true },
  { name: "Personal Items", color: "#6366F1", isDefault: true },
  { name: "Education", color: "#3B82F6", isDefault: true },
  { name: "Salary", color: "#22C55E", isDefault: true },
  { name: "Transfer", color: "#94A3B8", isDefault: true },
  { name: "Fees & Admin", color: "#78716C", isDefault: true },
  { name: "Bills & Utilities", color: "#0EA5E9", isDefault: true },
  { name: "Shopping", color: "#F97316", isDefault: true },
  { name: "Uncategorized", color: "#D1D5DB", isDefault: true },
];

const sqlite = new Database("fintic.db");
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const db = drizzle(sqlite);

for (const cat of DEFAULT_CATEGORIES) {
  db.insert(categories)
    .values(cat)
    .onConflictDoNothing({ target: categories.name })
    .run();
}

console.log(`Seeded ${DEFAULT_CATEGORIES.length} default categories.`);
sqlite.close();
