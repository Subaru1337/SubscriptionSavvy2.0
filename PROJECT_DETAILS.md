# SubscriptionSavvy 2.0 - Comprehensive Project Reference

This document provides a complete, in-depth architectural and functional overview of **SubscriptionSavvy 2.0**. It is designed to serve as a high-fidelity context file for LLMs or developers onboarding to the codebase, explaining exactly how the application was built, the technologies used, and the inner workings of every feature.

---

## 1. Project Overview & Architecture

**SubscriptionSavvy** is a full-stack SaaS application designed to help users track, manage, and optimize their recurring subscriptions. It prevents wasted money by offering multi-currency cost tracking, visual spending analytics, payment calendar views, and automated email reminders for upcoming renewals and trial expirations.

### Technology Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Frontend UI:** React, Tailwind CSS (Custom CSS Variables Design System), Lucide Icons
- **Data Visualization:** Recharts
- **Backend/API:** Next.js Serverless Route Handlers
- **Database:** PostgreSQL (hosted on Supabase / Neon)
- **ORM:** Prisma
- **Authentication:** Custom JWT-based auth via `jose` (stored in secure `httpOnly` cookies)
- **Email Service:** Resend (Triggered via Vercel Cron Jobs)
- **Utilities:** `date-fns` (date manipulation), `csv-stringify` (CSV export), `jspdf` & `jspdf-autotable` (PDF export)
- **External APIs:** Frankfurter API (Free, no-auth multi-currency conversion rates)

### Directory Structure Overview
- `app/`: Next.js App Router structure. Contains all pages, layouts, and `api/` route handlers.
- `components/`: React components separated into `layout/` (Sidebar, Nav), `subscriptions/` (Modals), `ui/` (Badges, Skeletons), and `providers/` (ThemeProvider).
- `lib/`: Core backend and utility logic (`auth.ts`, `prisma.ts`, `currency.ts`, `email.ts`, `payment-status.ts`).
- `prisma/`: Contains `schema.prisma` mapping out the database architecture.
- `public/`: Static assets, PWA Manifest (`manifest.json`), and Service Worker (`sw.js`).

---

## 2. Database Schema (Prisma)

The application relies on three relational models:

1. **User:**
   - Stores `email`, `passwordHash` (bcrypt), user settings like `baseCurrency` (default: INR), `monthlyBudget`, and `emailReminders` boolean.
   - Contains a `budgetAlertSentAt` timestamp to prevent spamming budget emails.
2. **Subscription:**
   - Linked to `userId`.
   - Stores `name`, `cost` (Decimal), `currency` (String), `billingCycle` (monthly/yearly), `category`, `nextPayment` (DateTime), `trialEndsOn` (DateTime, optional), and `status` (active/paused/cancelled).
3. **PaymentHistory:**
   - Linked to `subscriptionId`.
   - Records past payments whenever a user clicks "Mark as Paid". Stores the `amount`, `currency`, and `paidAt` timestamp. Used for generating historical trend charts.

---

## 3. Core Mechanisms & Integrations

### Authentication (`lib/auth.ts` & `middleware.ts`)
- **Flow:** User submits email/password to `/api/auth/login` or `register`. Backend hashes passwords using `bcrypt`.
- **Token Generation:** A JWT is signed using the `jose` library (which is Edge runtime compatible for Next.js middleware).
- **Storage:** The JWT is serialized into a secure, `httpOnly`, `SameSite=lax` cookie named `ss-token`.
- **Protection:** `middleware.ts` intercepts requests to protected routes (`/dashboard`, `/subscriptions`, `/calendar`, `/reminders`, `/settings`, and `/api/*`), verifies the JWT signature, and redirects to `/auth` if invalid. 
- **User Retrieval:** APIs use `getAuthUser()` helper to verify the cookie and query the current user from Prisma in one step.

### Multi-Currency System (`lib/currency.ts`)
- **Problem:** Users have subscriptions in USD, EUR, INR, etc., but want to see their total spend in their configured `baseCurrency`.
- **Solution:** The app fetches the latest exchange rates from the public **Frankfurter API**.
- **Caching:** To prevent rate-limiting and slow API routes, rates are cached in-memory using a global Node.js variable with a 24-hour expiration mechanism (`RATE_CACHE`).
- **Conversion:** `convertAmount(amount, fromCurrency, toCurrency)` handles the math using the cached rates.

### Design System & Theming (`app/globals.css`)
- **Methodology:** Avoids heavy UI frameworks. Instead, utilizes a meticulously defined set of CSS variables (`--background`, `--card`, `--primary`, `--text-secondary`, etc.) inside `@layer base`.
- **Dark Mode:** A `ThemeProvider` (`components/providers/ThemeProvider.tsx`) reads system preferences or `localStorage` to toggle a `.dark` class on the `<html>` element. The CSS variables automatically swap to dark-mode hex codes.

### PWA Implementation
- **Service Worker (`public/sw.js`):** Implements a cache-first strategy for the App Shell (static assets, UI pages) and a network-first strategy for `/api/` routes.
- **Manifest (`public/manifest.json`):** Defines standalone display mode, theme colors, and paths to the generated 192x192 and 512x512 app icons.

---

## 4. Features & How They Work

### A. Dashboard & Analytics (`/dashboard`)
**Functionality:** Provides a high-level financial overview.
**Implementation:**
- Fetches from `/api/analytics/summary`, `/api/analytics/category-breakdown`, and `/api/analytics/trends`.
- **Summary API:** Pulls all active subscriptions, converts their costs to the user's `baseCurrency`, and calculates `monthly_total` and `annual_total`. Compares this against `monthlyBudget` to return a `budget_used_percent`.
- **Trend API:** Combines actual `PaymentHistory` records (past data) with projected upcoming payments (future data based on billing cycles) to generate a 6-month timeline array.
- **UI:** Uses `Recharts` to render a Pie Chart for categories and a Line Chart for the 6-month trend.

### B. Subscription Management (`/subscriptions`)
**Functionality:** Full CRUD interface for subscriptions with filtering and bulk operations.
**Implementation:**
- **UI Layout:** Renders an HTML `<table>` on desktop and stacked summary cards on mobile. Includes search bar and status/category dropdown filters handled strictly client-side for immediate feedback.
- **SubscriptionModal:** A complex form used for both Adding and Editing. Includes a "Quick Add" horizontal scrollbar that pre-fills the form with popular services (Netflix, Spotify, AWS, etc.).
- **Exporting:** 
  - CSV: Uses `csv-stringify/sync` on the backend to stream a CSV response.
  - PDF: Uses `jspdf` and `jspdf-autotable` to generate a formatted PDF report with totals and category summaries.
- **Importing (`ImportCSVModal`):**
  - Parses uploaded CSV files using `csv-parse`.
  - Analyzes rows against the database to flag `isDuplicate` (matching name).
  - Presents a preview table where users can check/uncheck rows before committing the batch insert to the database.

### C. Reminders & "Mark as Paid" (`/reminders`)
**Functionality:** Groups subscriptions by urgency so users know what to pay/cancel next.
**Implementation:**
- **Status Logic (`lib/payment-status.ts`):** A universal utility function that compares `nextPayment` to `new Date()` and returns a status object (Overdue, Due Today, Due This Week, Upcoming) along with the correct UI hex colors.
- **Mark as Paid:** When clicked, it hits `/api/subscriptions/[id]/pay`. The backend creates a new `PaymentHistory` record for today, and advances the subscription's `nextPayment` date forward by exactly 1 month or 1 year depending on the `billingCycle`.

### D. Payment Calendar (`/calendar`)
**Functionality:** Visual monthly grid showing when bills hit.
**Implementation:**
- Entirely built using `date-fns` logic (`startOfMonth`, `endOfMonth`, `eachDayOfInterval`).
- Renders a 7-column CSS grid. It matches subscriptions to calendar days based on `isSameDay()`.
- Renders small color-coded dots (colors pulled from `payment-status.ts`) on days with payments. Clicking a day opens a popover detailing the subscriptions.

### E. Automated Email Engine (`/api/cron/reminders`)
**Functionality:** Sends background emails without user interaction.
**Implementation:**
- **Trigger:** Configured in `vercel.json` as a CRON job hitting the endpoint daily at 00:00 UTC. Secured by checking `process.env.CRON_SECRET` in the Authorization header.
- **Logic:**
  1. Scans all active users who have `emailReminders = true`.
  2. Finds active subscriptions where `nextPayment` is exactly 3 days away. Sends a Payment Reminder Email via Resend.
  3. Finds active subscriptions where `trialEndsOn` is exactly 3 days away. Sends a Trial Expiry Email.
  4. Calculates user's total monthly spend. If `spend >= (budget * 0.90)` and no alert has been sent this month (`budgetAlertSentAt`), it sends a Budget Warning Email and updates the timestamp.
- **Email Client:** Uses the `resend` SDK. The client is lazily initialized inside functions to prevent build-time crashes if the API key is missing. HTML email templates are heavily branded with the app's teal color scheme.

---

## 5. Developer Guide / How to Run

1. **Environment Setup:** Create a `.env` file containing:
   ```env
   DATABASE_URL="postgresql://user:pass@host:6543/db?pgbouncer=true"
   DIRECT_URL="postgresql://user:pass@host:5432/db"
   JWT_SECRET="your-secret-key"
   RESEND_API_KEY="re_..."
   ```
2. **Database Initialization:** 
   Run `npx prisma db push` to synchronize the Supabase/Neon database schema.
3. **Running the App:**
   Run `npm install` and `npm run dev`. The app boots at `http://localhost:3000`.

## 6. Known Quirks / Contextual Notes
- Prisma interacting with Supabase's transaction pooler (port 6543) will hang during migrations/schema pushes. The project is specifically configured to use a `DIRECT_URL` (port 5432) inside `schema.prisma` to bypass this issue seamlessly.
- Next.js 14 serverless compilation is optimized by marking `bcrypt`, `jose`, and `recharts` appropriately in the build step, ensuring fast cold starts on Vercel.
