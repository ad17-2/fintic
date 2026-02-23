export interface SummaryData {
  totalIncome: number;
  totalExpenses: number;
  allocations: number;
  net: number;
  balance: number;
  incomeChange: number;
  expenseChange: number;
  allocationChange: number;
  dailySpending: DailyData[];
}

export interface DailyData {
  day: number;
  amount: number;
}

export interface CategoryData {
  categoryId: number | null;
  categoryName: string;
  color: string;
  total: number;
  percentage: number;
}

export interface TrendData {
  label: string;
  income: number;
  expense: number;
}

export interface MerchantData {
  merchant: string;
  total: number;
  count: number;
}

export interface ComparisonData {
  categoryId: number | null;
  category: string;
  color: string;
  current: number;
  previous: number;
}

export interface VelocityData {
  totalSpent: number;
  avgDailySpend: number;
  daysElapsed: number;
  daysRemaining: number;
  daysInMonth: number;
  projectedTotal: number;
  budget: number;
  budgetRemaining: number;
  pacePercent: number;
}

export interface YoYItem {
  category: string;
  color: string;
  current: number;
  previousYear: number;
  changePercent: number;
}

export interface DowItem {
  day: string;
  total: number;
  count: number;
}

export interface SavingsRateItem {
  label: string;
  savingsRate: number;
}

export interface CategoryTrendMonth {
  month: number;
  year: number;
  label: string;
  total: number;
}

export interface CategoryTrendItem {
  categoryName: string;
  color: string;
  months: CategoryTrendMonth[];
}

export interface AnomalyItem {
  categoryName: string;
  color: string;
  currentTotal: number;
  rollingAverage: number;
  percentAboveAverage: number;
}

export interface RecurringItem {
  merchant: string;
  averageAmount: number;
  monthsAppeared: number;
  currentMonthAmount: number;
}

export interface RecurringData {
  recurring: number;
  oneTime: number;
  recurringItems: RecurringItem[];
}

export interface Category {
  id: number;
  name: string;
  color: string;
  isDefault?: boolean;
}

export interface UploadRecord {
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
  uploadedAt: string;
}

export interface TransactionRecord {
  id: number;
  date: string;
  description: string;
  merchant: string | null;
  branch?: string | null;
  amount: number;
  type: string;
  balance: number;
  categoryId: number | null;
  notes: string | null;
}

export interface TransactionWithCategory extends TransactionRecord {
  categoryName: string | null;
  categoryColor: string | null;
}
