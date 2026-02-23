import { z } from "zod";

export const monthYearSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const monthsSchema = z.object({
  months: z.coerce.number().int().min(1).max(120).default(12),
});

export const transactionFilterSchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  type: z.enum(["debit", "credit"]).optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const loginSchema = z.object({
  password: z.string().min(1, "Password is required").max(500),
});

export const transactionPatchSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  description: z.string().min(1).max(500).optional(),
  merchant: z.string().max(200).nullable().optional(),
  amount: z.number().positive().optional(),
  type: z.enum(["debit", "credit"]).optional(),
  categoryId: z.number().int().positive().nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export const categoryCreateSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export const categoryPatchSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const byCategorySchema = monthYearSchema.extend({
  type: z.enum(["debit", "credit"]).default("debit"),
});

export function parseSearchParams<T extends z.ZodType>(
  schema: T,
  searchParams: URLSearchParams,
) {
  const obj: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    obj[key] = value;
  });
  return schema.safeParse(obj);
}
