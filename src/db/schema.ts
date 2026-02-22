import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  color: text("color").notNull(),
  isDefault: integer("is_default", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const uploads = sqliteTable("uploads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  filename: text("filename").notNull(),
  uploadedAt: text("uploaded_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  openingBalance: real("opening_balance"),
  closingBalance: real("closing_balance"),
  totalCredit: real("total_credit"),
  totalDebit: real("total_debit"),
  transactionCount: integer("transaction_count").notNull(),
  status: text("status").notNull().default("pending"),
});

export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  uploadId: integer("upload_id")
    .notNull()
    .references(() => uploads.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  description: text("description").notNull(),
  branch: text("branch"),
  amount: real("amount").notNull(),
  type: text("type").notNull(),
  balance: real("balance").notNull(),
  categoryId: integer("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});
