"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MONTHS } from "@/lib/constants";

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);
const MIN_YEAR = YEARS[YEARS.length - 1];
const MAX_YEAR = YEARS[0];

export function PeriodSelector({
  month,
  year,
  onMonthChange,
  onYearChange,
}: {
  month: string;
  year: string;
  onMonthChange: (value: string) => void;
  onYearChange: (value: string) => void;
}) {
  const m = Number(month);
  const y = Number(year);

  function goBack() {
    if (m === 1) {
      if (y > MIN_YEAR) {
        onMonthChange("12");
        onYearChange(String(y - 1));
      }
    } else {
      onMonthChange(String(m - 1));
    }
  }

  function goForward() {
    if (m === 12) {
      if (y < MAX_YEAR) {
        onMonthChange("1");
        onYearChange(String(y + 1));
      }
    } else {
      onMonthChange(String(m + 1));
    }
  }

  const atMin = m === 1 && y <= MIN_YEAR;
  const atMax = m === 12 && y >= MAX_YEAR;

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        disabled={atMin}
        onClick={goBack}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Select value={month} onValueChange={onMonthChange}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MONTHS.map((m, i) => (
            <SelectItem key={i} value={String(i + 1)}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={year} onValueChange={onYearChange}>
        <SelectTrigger className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {YEARS.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        disabled={atMax}
        onClick={goForward}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
