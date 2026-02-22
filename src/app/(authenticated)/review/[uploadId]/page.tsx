"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatIDR } from "@/lib/format";

interface Transaction {
  id: number;
  date: string;
  description: string;
  branch: string;
  amount: number;
  type: string;
  balance: number;
  categoryId: number | null;
  notes: string | null;
}

interface Upload {
  id: number;
  filename: string;
  month: number;
  year: number;
  openingBalance: number | null;
  closingBalance: number | null;
  totalCredit: number | null;
  totalDebit: number | null;
  transactionCount: number;
  status: string;
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

export default function ReviewPage() {
  const router = useRouter();
  const params = useParams();
  const uploadId = params.uploadId as string;

  const [upload, setUpload] = useState<Upload | null>(null);
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [bulkCategoryId, setBulkCategoryId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [uploadRes, catsRes] = await Promise.all([
      fetch(`/api/uploads/${uploadId}`),
      fetch("/api/categories"),
    ]);

    if (!uploadRes.ok) {
      toast.error("Upload not found");
      router.push("/upload");
      return;
    }

    const uploadData = await uploadRes.json();
    setUpload(uploadData.upload);
    setTxns(uploadData.transactions);
    setCategories(await catsRes.json());
    setLoading(false);
  }, [uploadId, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function updateTransaction(
    id: number,
    field: string,
    value: unknown
  ) {
    const res = await fetch(`/api/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });

    if (res.ok) {
      const updated = await res.json();
      setTxns((prev) => prev.map((t) => (t.id === id ? updated : t)));
    }
  }

  async function deleteTransaction(id: number) {
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (res.ok) {
      setTxns((prev) => prev.filter((t) => t.id !== id));
      selectedRows.delete(id);
      setSelectedRows(new Set(selectedRows));
      toast.success("Transaction removed");
    }
  }

  async function handleBulkCategory() {
    if (!bulkCategoryId || selectedRows.size === 0) return;

    const promises = Array.from(selectedRows).map((id) =>
      fetch(`/api/transactions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: Number(bulkCategoryId) }),
      }).then((res) => res.json())
    );

    const results = await Promise.all(promises);
    setTxns((prev) =>
      prev.map((t) => {
        const updated = results.find((r) => r.id === t.id);
        return updated ?? t;
      })
    );
    setSelectedRows(new Set());
    setBulkCategoryId("");
    toast.success(`Updated ${results.length} transactions`);
  }

  async function handleCommit() {
    const res = await fetch(`/api/uploads/${uploadId}/commit`, {
      method: "POST",
    });
    if (res.ok) {
      toast.success("Upload committed successfully");
      router.push("/dashboard");
    } else {
      toast.error("Failed to commit");
    }
  }

  async function handleDiscard() {
    const res = await fetch(`/api/uploads/${uploadId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Upload discarded");
      router.push("/upload");
    }
  }

  function toggleRow(id: number) {
    const next = new Set(selectedRows);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedRows(next);
  }

  function toggleAll() {
    if (selectedRows.size === txns.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(txns.map((t) => t.id)));
    }
  }

  if (loading) {
    return <div className="p-4 text-muted-foreground">Loading...</div>;
  }

  if (!upload) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Review Transactions</h1>
          <p className="text-sm text-muted-foreground">
            {MONTHS[upload.month - 1]} {upload.year} &middot;{" "}
            {upload.filename}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDiscard}>
            <X className="mr-2 h-4 w-4" />
            Discard
          </Button>
          <Button onClick={handleCommit}>
            <Check className="mr-2 h-4 w-4" />
            Commit
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <SummaryItem
              label="Opening Balance"
              value={formatIDR(upload.openingBalance ?? 0)}
            />
            <SummaryItem
              label="Closing Balance"
              value={formatIDR(upload.closingBalance ?? 0)}
            />
            <SummaryItem
              label="Total Credit"
              value={formatIDR(upload.totalCredit ?? 0)}
              className="text-green-600"
            />
            <SummaryItem
              label="Total Debit"
              value={formatIDR(upload.totalDebit ?? 0)}
              className="text-red-600"
            />
          </div>
        </CardContent>
      </Card>

      {selectedRows.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
          <span className="text-sm font-medium">
            {selectedRows.size} selected
          </span>
          <Select value={bulkCategoryId} onValueChange={setBulkCategoryId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Assign category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    {c.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleBulkCategory} disabled={!bulkCategoryId}>
            Apply
          </Button>
        </div>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={selectedRows.size === txns.length && txns.length > 0}
                  onChange={toggleAll}
                  className="rounded"
                />
              </TableHead>
              <TableHead className="w-28">Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-28">Amount</TableHead>
              <TableHead className="w-16">Type</TableHead>
              <TableHead className="w-44">Category</TableHead>
              <TableHead className="w-40">Notes</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {txns.map((txn) => (
              <TransactionRow
                key={txn.id}
                txn={txn}
                categories={categories}
                selected={selectedRows.has(txn.id)}
                onToggle={() => toggleRow(txn.id)}
                onUpdate={updateTransaction}
                onDelete={() => deleteTransaction(txn.id)}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function SummaryItem({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold ${className ?? ""}`}>{value}</p>
    </div>
  );
}

function TransactionRow({
  txn,
  categories,
  selected,
  onToggle,
  onUpdate,
  onDelete,
}: {
  txn: Transaction;
  categories: Category[];
  selected: boolean;
  onToggle: () => void;
  onUpdate: (id: number, field: string, value: unknown) => void;
  onDelete: () => void;
}) {
  const categoryName = categories.find((c) => c.id === txn.categoryId)?.name;

  return (
    <TableRow className={selected ? "bg-muted/50" : ""}>
      <TableCell>
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="rounded"
        />
      </TableCell>
      <TableCell>
        <Input
          type="date"
          value={txn.date}
          className="h-8 text-xs"
          onChange={(e) => onUpdate(txn.id, "date", e.target.value)}
        />
      </TableCell>
      <TableCell>
        <Input
          value={txn.description}
          className="h-8 text-xs"
          onChange={(e) =>
            onUpdate(txn.id, "description", e.target.value)
          }
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          value={txn.amount}
          className="h-8 text-xs"
          onChange={(e) =>
            onUpdate(txn.id, "amount", parseFloat(e.target.value))
          }
        />
      </TableCell>
      <TableCell>
        <Badge
          variant={txn.type === "debit" ? "destructive" : "default"}
          className="text-xs"
        >
          {txn.type === "debit" ? "DB" : "CR"}
        </Badge>
      </TableCell>
      <TableCell>
        <Select
          value={txn.categoryId ? String(txn.categoryId) : "none"}
          onValueChange={(v) =>
            onUpdate(txn.id, "categoryId", v === "none" ? null : Number(v))
          }
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select" />
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
      </TableCell>
      <TableCell>
        <Input
          value={txn.notes ?? ""}
          placeholder="Add note..."
          className="h-8 text-xs"
          onChange={(e) => onUpdate(txn.id, "notes", e.target.value)}
        />
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
