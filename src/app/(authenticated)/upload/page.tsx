"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Upload as UploadIcon, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatIDR } from "@/lib/format";

interface UploadRecord {
  id: number;
  filename: string;
  month: number;
  year: number;
  totalCredit: number | null;
  totalDebit: number | null;
  transactionCount: number;
  status: string;
  uploadedAt: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [uploading, setUploading] = useState(false);
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [dragging, setDragging] = useState(false);

  const fetchUploads = useCallback(async () => {
    const res = await fetch("/api/uploads");
    if (res.ok) setUploads(await res.json());
  }, []);

  useEffect(() => {
    fetchUploads();
  }, [fetchUploads]);

  async function handleUpload() {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("year", year);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Upload failed");
        return;
      }

      toast.success(`Parsed ${data.transactionCount} transactions`);
      router.push(`/review/${data.uploadId}`);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/uploads/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Upload deleted");
      fetchUploads();
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.name.endsWith(".csv") || droppedFile?.name.endsWith(".CSV")) {
      setFile(droppedFile);
    } else {
      toast.error("Please drop a CSV file");
    }
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Upload Statement</h1>

      <Card>
        <CardHeader>
          <CardTitle>Upload BCA CSV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
              dragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <UploadIcon className="mb-3 h-8 w-8 text-muted-foreground" />
            {file ? (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">{file.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Drag & drop CSV file here, or
                </p>
                <label className="mt-2 cursor-pointer">
                  <span className="text-sm font-medium text-primary underline">
                    browse files
                  </span>
                  <input
                    type="file"
                    accept=".csv,.CSV"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setFile(f);
                    }}
                  />
                </label>
              </>
            )}
          </div>

          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full"
          >
            {uploading ? "Parsing..." : "Upload & Parse"}
          </Button>
        </CardContent>
      </Card>

      {uploads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploads.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {MONTHS[u.month - 1]} {u.year}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {u.transactionCount} transactions &middot;{" "}
                        {u.filename}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="text-emerald-600 dark:text-emerald-400">
                          +{formatIDR(u.totalCredit ?? 0)}
                        </span>
                        {" / "}
                        <span className="text-rose-600 dark:text-rose-400">
                          -{formatIDR(u.totalDebit ?? 0)}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={u.status} />
                    {u.status === "pending" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/review/${u.id}`)}
                        >
                          Review
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(u.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "committed"
      ? "default"
      : status === "pending"
        ? "secondary"
        : "outline";

  return <Badge variant={variant}>{status}</Badge>;
}
