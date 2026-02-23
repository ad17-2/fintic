# Fintic

Personal financial analytics dashboard for tracking income, expenses, and spending patterns. Built for Indonesian BCA bank statements with AI-powered transaction categorization and a rich set of analytics widgets.

## Features

### Statement Upload and Parsing

- Upload BCA bank statements in CSV or PDF format
- CSV files are parsed deterministically with built-in BCA format support
- PDF files are extracted using `pdftotext` and then processed by Claude (Anthropic) to produce structured transaction data
- Automatic merchant name extraction from various BCA transaction formats (QR payments, BI-FAST transfers, FTSCY, FTFVA, debit cards, admin fees)
- Statement metadata captured: opening/closing balance, total credits, total debits

### AI-Powered Categorization

- Transactions are automatically categorized using Claude via the Anthropic API
- 13 default categories: Investing, Tithe, Family, Food, Health, Personal Items, Education, Salary, Transfer, Fees & Admin, Bills & Utilities, Shopping, Uncategorized
- PDF uploads get categories assigned during extraction; CSV uploads are categorized in a separate batch pass
- Categories can be manually adjusted during the review step or later on the transactions page

### Review and Commit Workflow

- Uploaded statements land in a "pending" state for review before affecting dashboard analytics
- Review page allows editing individual transactions (date, description, merchant, category, notes)
- Bulk category assignment for selected transactions
- Commit to finalize or discard to remove -- only committed uploads appear in analytics

### Transaction Management

- Filterable, sortable, paginated transaction list
- Filter by month/year, transaction type (debit/credit), category, and free-text search across description and merchant
- Sortable columns: date, amount, merchant, category
- Inline editing via modal dialog (date, description, merchant, amount, category, notes)
- Aggregated totals (income, expenses, net) shown per filtered view

### Category Management

- Create custom categories with a name and color
- Edit or rename existing categories
- Delete non-default categories (default categories are protected)
- Color picker with 12 preset colors

### Dashboard Analytics

The dashboard displays analytics for a selected month/year period with the following widgets:

- **Summary Cards** -- Total income, total expenses, allocations (Investing/Tithe/Family), net balance, and month-over-month percentage changes
- **Spending Velocity** -- Average daily spend, projected monthly total, budget remaining, pace percentage relative to income
- **Anomaly Detection** -- Flags categories where current month spending exceeds the 3-month rolling average by more than 30% (minimum threshold: Rp 100,000)
- **Income vs Expense Trend** -- Bar chart showing income, expenses, and allocations over the last 12 months
- **Category Breakdown** -- Pie chart of spending by category for the selected month with percentages
- **Daily Spending** -- Bar chart of daily debit totals within the selected month
- **Top Merchants** -- Top 10 merchants by spending amount for the selected month
- **Category Comparison** -- Current month vs previous month spending per category (side-by-side bars)
- **Recurring Spending** -- Identifies merchants appearing in 2+ of the last 3 months with consistent amounts, shows recurring vs one-time split
- **Category Trends** -- Sparkline-style line charts for the top 8 spending categories over 6 months
- **Year-over-Year Comparison** -- Same-month comparison against the prior year per category with percent change
- **Spending by Day of Week** -- Bar chart showing spending distribution across weekdays
- **Savings Rate** -- Line chart of savings rate (income minus expenses, divided by income) over 12 months

### Authentication

- Password-based single-user authentication
- JWT sessions (HS256) with 30-day expiry stored in HTTP-only cookies
- Rate-limited login endpoint (5 attempts per 15 minutes per IP)
- Middleware-level route protection -- unauthenticated requests redirect to `/login`

### Security

- HTTP security headers: X-Content-Type-Options, X-Frame-Options, HSTS, Referrer-Policy, Permissions-Policy
- All API inputs validated with Zod schemas
- Parameterized database queries via Drizzle ORM
- Passwords hashed with bcrypt

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict mode) |
| UI | React 19, Tailwind CSS 4, shadcn/ui, Radix UI primitives |
| Charts | Recharts |
| Database | SQLite via better-sqlite3, Drizzle ORM |
| AI | Anthropic Claude API (claude-sonnet-4-6) |
| Auth | jose (JWT), bcryptjs |
| Validation | Zod |
| PDF Parsing | pdftotext (system dependency) |
| Notifications | Sonner |
| Icons | Lucide React |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- `pdftotext` CLI tool (from poppler-utils) -- required only for PDF uploads

On macOS:

```bash
brew install poppler
```

On Ubuntu/Debian:

```bash
sudo apt-get install poppler-utils
```

### Installation

```bash
pnpm install
```

### Environment Variables

Create a `.env` file in the project root with the following variables:

```
AUTH_SECRET=<random-string-for-jwt-signing>
PASSWORD_HASH=<bcrypt-hash-of-your-password>
ANTHROPIC_API_KEY=<your-anthropic-api-key>
```

Generate a password hash with bcrypt:

```bash
node -e "require('bcryptjs').hash('your-password', 10).then(console.log)"
```

Generate a random auth secret:

```bash
openssl rand -base64 32
```

| Variable | Required | Description |
|---|---|---|
| `AUTH_SECRET` | Yes | Secret key for signing JWT session tokens |
| `PASSWORD_HASH` | Yes | bcrypt hash of the login password |
| `ANTHROPIC_API_KEY` | Yes | API key for Claude (used for auto-categorization and PDF extraction) |

### Database Setup

Run Drizzle migrations to create the SQLite database:

```bash
pnpm db:migrate
```

Seed the default categories:

```bash
pnpm db:seed
```

The database file `fintic.db` is created in the project root. It uses WAL journal mode and has foreign keys enabled.

### Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. You will be redirected to the login page.

### Production Build

```bash
pnpm build
pnpm start
```

## Project Structure

```
src/
  app/
    api/
      auth/
        login/route.ts        # POST -- authenticate and set session cookie
        logout/route.ts       # POST -- clear session cookie
      categories/
        route.ts              # GET (list), POST (create)
        [id]/route.ts         # PATCH (update), DELETE
      stats/
        anomalies/route.ts    # GET -- spending anomaly detection
        by-category/route.ts  # GET -- category breakdown for a month
        category-comparison/  # GET -- current vs previous month by category
        category-trends/      # GET -- top category trends over 6 months
        recurring/route.ts    # GET -- recurring vs one-time spending
        savings-rate/route.ts # GET -- savings rate over N months
        spending-by-dow/      # GET -- spending by day of week
        spending-velocity/    # GET -- daily spend pace and projection
        summary/route.ts      # GET -- income, expenses, allocations, balance
        top-merchants/        # GET -- top 10 merchants by spend
        trends/route.ts       # GET -- income/expense trend over N months
        yoy-comparison/       # GET -- year-over-year category comparison
      transactions/
        route.ts              # GET (list with filters, sort, pagination)
        [id]/route.ts         # PATCH (update), DELETE
      upload/route.ts         # POST -- upload and parse CSV/PDF
      uploads/
        route.ts              # GET (list all uploads)
        [id]/route.ts         # GET (upload detail + transactions), DELETE
        [id]/commit/route.ts  # POST -- commit a pending upload
    (authenticated)/
      layout.tsx              # Sidebar + mobile nav shell
      dashboard/page.tsx      # Analytics dashboard
      upload/page.tsx         # File upload and history
      transactions/page.tsx   # Transaction list with filters
      categories/page.tsx     # Category management
      review/[uploadId]/      # Review pending upload before commit
    login/page.tsx            # Login page
    layout.tsx                # Root layout (fonts, toaster)
    page.tsx                  # Redirects to /dashboard
  components/
    dashboard/                # All dashboard chart/widget components
    layout/                   # Sidebar and mobile navigation
    ui/                       # shadcn/ui primitives
  db/
    index.ts                  # Database connection (singleton)
    schema.ts                 # Drizzle schema (categories, uploads, transactions)
    queries.ts                # Shared query helpers
    seed.ts                   # Seed script for default categories
  hooks/
    use-dashboard-data.ts     # Dashboard data fetching hook
  lib/
    api-utils.ts              # Error response helper
    auth.ts                   # JWT/session management
    chart-utils.ts            # Axis formatting, string truncation
    constants.ts              # Month names, allocation category list
    csv-parser.ts             # BCA CSV parsing and merchant extraction
    format.ts                 # IDR currency and date formatting
    llm.ts                    # Anthropic API integration (categorization, PDF extraction)
    navigation.ts             # Nav item definitions
    rate-limit.ts             # In-memory rate limiter
    types.ts                  # Shared TypeScript interfaces
    validation.ts             # Zod schemas for all API inputs
  middleware.ts               # JWT verification, route protection
drizzle/                      # Migration SQL files
drizzle.config.ts             # Drizzle Kit configuration
```

## Database Schema

Three tables managed by Drizzle ORM:

**categories** -- Transaction categories with color coding.

| Column | Type | Notes |
|---|---|---|
| id | integer | Primary key, auto-increment |
| name | text | Unique |
| color | text | Hex color code |
| is_default | boolean | Protected from deletion |
| created_at | text | ISO datetime |

**uploads** -- Each uploaded bank statement.

| Column | Type | Notes |
|---|---|---|
| id | integer | Primary key, auto-increment |
| filename | text | Original filename |
| uploaded_at | text | ISO datetime |
| month | integer | Statement month (1-12) |
| year | integer | Statement year |
| opening_balance | real | Nullable |
| closing_balance | real | Nullable |
| total_credit | real | Nullable |
| total_debit | real | Nullable |
| transaction_count | integer | Number of transactions |
| status | text | "pending" or "committed" |

**transactions** -- Individual transactions linked to an upload.

| Column | Type | Notes |
|---|---|---|
| id | integer | Primary key, auto-increment |
| upload_id | integer | FK to uploads (cascade delete) |
| date | text | YYYY-MM-DD |
| description | text | Raw transaction description |
| merchant | text | Extracted merchant name (nullable) |
| branch | text | Branch code (nullable) |
| amount | real | Always positive |
| type | text | "debit" or "credit" |
| balance | real | Running balance after transaction |
| category_id | integer | FK to categories (set null on delete) |
| notes | text | User notes (nullable) |
| created_at | text | ISO datetime |
| updated_at | text | ISO datetime |

## API Reference

All API routes require authentication (JWT cookie) except `/api/auth/login`.

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Authenticate with password. Returns session cookie. Rate limited (5/15min). |
| POST | `/api/auth/logout` | Clear session cookie. |

### Upload

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/upload` | Upload CSV or PDF file with `year` form field. Parses, categorizes, returns `uploadId`. |
| GET | `/api/uploads` | List all uploads ordered by date descending. |
| GET | `/api/uploads/:id` | Get upload details and its transactions. |
| DELETE | `/api/uploads/:id` | Delete a pending upload (committed uploads cannot be deleted). |
| POST | `/api/uploads/:id/commit` | Commit a pending upload so its transactions appear in analytics. |

### Transactions

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/transactions` | List transactions with optional filters: `month`, `year`, `categoryId`, `type`, `search`, `sortBy`, `sortDir`, `page`, `limit`. |
| PATCH | `/api/transactions/:id` | Update transaction fields: `date`, `description`, `merchant`, `amount`, `type`, `categoryId`, `notes`. |
| DELETE | `/api/transactions/:id` | Delete a single transaction. |

### Categories

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/categories` | List all categories. |
| POST | `/api/categories` | Create a category with `name` and `color` (hex). |
| PATCH | `/api/categories/:id` | Update category `name` and/or `color`. |
| DELETE | `/api/categories/:id` | Delete a non-default category. |

### Analytics

All stats endpoints require `month` and `year` query parameters unless noted otherwise.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/stats/summary` | Income, expenses, allocations, net, balance, MoM changes, daily spending. |
| GET | `/api/stats/spending-velocity` | Average daily spend, projected total, budget remaining, pace percent. |
| GET | `/api/stats/anomalies` | Categories exceeding 3-month rolling average by 30%+. |
| GET | `/api/stats/by-category` | Spending breakdown by category with percentages. Accepts `type` param. |
| GET | `/api/stats/trends` | Income/expense/allocation trend. Param: `months` (default 12). |
| GET | `/api/stats/top-merchants` | Top 10 merchants by debit amount. |
| GET | `/api/stats/category-comparison` | Current vs previous month by category. |
| GET | `/api/stats/recurring` | Recurring vs one-time spending split with recurring merchant list. |
| GET | `/api/stats/category-trends` | Top 8 categories over 6-month window with monthly totals. |
| GET | `/api/stats/yoy-comparison` | Same month current year vs prior year per category. |
| GET | `/api/stats/spending-by-dow` | Spending totals and counts by day of week (Mon-Sun). |
| GET | `/api/stats/savings-rate` | Monthly savings rate over N months. Param: `months` (default 12). |

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm db:generate` | Generate Drizzle migration files from schema changes |
| `pnpm db:migrate` | Apply pending database migrations |
| `pnpm db:seed` | Seed default categories |
| `pnpm db:studio` | Open Drizzle Studio (database GUI) |

## License

Private project. Not licensed for redistribution.
