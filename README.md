# SubscriptionSavvy

A comprehensive, cross-platform platform for tracking, analyzing, and managing personal subscriptions. Built as a scalable full-stack monorepo, it features a responsive web dashboard, a native mobile application, and a secure backend infrastructure.

## Tech Stack

- **Web:** Next.js (App Router), Tailwind CSS, Framer Motion, TanStack React Query, Zustand, Recharts
- **Mobile:** React Native (Expo), NativeWind, React Native Reanimated
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions)
- **Architecture:** Turborepo Monorepo (100% code sharing for utilities and types)

## Project Structure

This project is structured as a monorepo using [Turborepo](https://turbo.build/) to manage multiple applications and shared packages seamlessly.

- `apps/web`: The Next.js web application and analytics dashboard.
- `apps/mobile`: The Expo React Native mobile application.
- `packages/utils`: Shared utility functions, API types, and business logic.
- `supabase/functions`: Backend edge functions and automated cron jobs.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm
- A Supabase project (for database and authentication)

### Installation

1. Clone the repository and navigate into the directory.
2. Install dependencies across all workspaces:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Create `.env.local` files in `apps/web` and `apps/mobile` with your Supabase credentials.

### Development

Start the development servers for all applications simultaneously:

```bash
npm run dev
```

To run individual applications:
- **Web App:** `npm run web`
- **Mobile App:** `npm run mobile`

## Core Features

- **Unified Experience:** A consistent "Ink & Amber" design system implemented across both web and mobile platforms.
- **Data Visualization:** Interactive dashboards powered by Recharts for analyzing spending habits and subscription cycles.
- **Automated Alerts:** Background tasks powered by Supabase Edge Functions ensure you never miss a renewal date.
- **Optimized Performance:** Aggressive client-side caching via React Query and Server-Side Rendering via Next.js for lightning-fast load times.
