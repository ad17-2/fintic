"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatIDR, formatDate } from "@/lib/format";

interface Transaction {
  id: number;
  date: string;
  description: string;
  merchant: string | null;
  amount: number;
  type: string;
  balance: number;
  categoryId: number | null;
  categoryName: string | null;
  categoryColor: string | null;
  notes: string | null;
}

interface Category {
  id: number;
  name: string;
  color: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function TransactionsPage() {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [type, setType] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);

  const fetchTransactions = useCallback(async () => {
    const params = new URLSearchParams({
      month,
      year,
      page: String(page),
      limit: "50",
    });

    if (type !== "all") params.set("type", type);
    if (categoryFilter !== "all") params.set("categoryId", categoryFilter);
    if (search) params.set("search", search);

    const res = await fetch(`/api/transactions?${params}`);
    if (res.ok) {
      const data = await res.json();
      setTxns(data.transactions);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    }
  }, [month, year, type, categoryFilter, search, page]);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <span className="text-sm text-muted-foreground">{total} total</span>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={month} onValueChange={(v) => { setMonth(v); setPage(1); }}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((m, i) => (
              <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={year} onValueChange={(v) => { setYear(v); setPage(1); }}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={type} onValueChange={(v) => { setType(v); setPage(1); }}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="debit">Debit</SelectItem>
            <SelectItem value="credit">Credit</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                <span className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search description or merchant..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {txns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              txns.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell className="text-sm whitespace-nowrap">
                    {formatDate(txn.date)}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm">
                    {txn.description}
                  </TableCell>
                  <TableCell className="text-sm">
                    {txn.merchant || "—"}
                  </TableCell>
                  <TableCell>
                    {txn.categoryName ? (
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{ borderColor: txn.categoryColor ?? undefined }}
                      >
                        <span
                          className="mr-1.5 inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: txn.categoryColor ?? undefined }}
                        />
                        {txn.categoryName}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {formatIDR(txn.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={txn.type === "debit" ? "destructive" : "default"}
                      className="text-xs"
                    >
                      {txn.type === "debit" ? "DB" : "CR"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-32 truncate text-xs text-muted-foreground">
                    {txn.notes || "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingTxn({ ...txn })}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {editingTxn && (
        <EditTransactionDialog
          txn={editingTxn}
          categories={categories}
          onClose={() => setEditingTxn(null)}
          onSaved={(updated) => {
            setTxns((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
            setEditingTxn(null);
          }}
        />
      )}
    </div>
  );
}

function EditTransactionDialog({
  txn,
  categories,
  onClose,
  onSaved,
}: {
  txn: Transaction;
  categories: Category[];
  onClose: () => void;
  onSaved: (updated: Transaction) => void;
}) {
  const [form, setForm] = useState({
    date: txn.date,
    description: txn.description,
    merchant: txn.merchant ?? "",
    amount: txn.amount,
    categoryId: txn.categoryId,
    notes: txn.notes ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/transactions/${txn.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: form.date,
        description: form.description,
        merchant: form.merchant || null,
        amount: form.amount,
        categoryId: form.categoryId,
        notes: form.notes || null,
      }),
    });

    if (res.ok) {
      const updated = await res.json();
      const cat = categories.find((c) => c.id === updated.categoryId);
      onSaved({
        ...updated,
        categoryName: cat?.name ?? null,
        categoryColor: cat?.color ?? null,
      });
      toast.success("Transaction updated");
    } else {
      toast.error("Failed to update transaction");
    }
    setSaving(false);
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Merchant</Label>
            <Input
              value={form.merchant}
              onChange={(e) => setForm({ ...form, merchant: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={form.categoryId ? String(form.categoryId) : "none"}
              onValueChange={(v) => setForm({ ...form, categoryId: v === "none" ? null : Number(v) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Uncategorized</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      {c.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Input
              value={form.notes}
              placeholder="Add note..."
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
