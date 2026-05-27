# SubscriptionSavvy 2.0 - Web App Features

This document outlines all the features implemented specifically in the **Web Application** version of SubscriptionSavvy 2.0. The web app is built with modern technologies like Next.js 14 (App Router), Prisma (PostgreSQL), Tailwind CSS, and Radix UI.

## 1. Authentication & User Management
- **Unified Login/Signup**: Secure authentication flow for user onboarding and returning users (`/auth`).
- **Session Tracking**: Logs user sessions including IP address and User Agent for security auditing.
- **Custom User Settings**: Users can set a primary base currency (e.g., INR, USD) that acts as the default for their workspace.

## 2. Subscription Management
- **Comprehensive CRUD Operations**: Users can add, view, edit, and delete their subscriptions.
- **Detailed Tracking**: Track essential data such as cost, billing cycle (monthly/yearly), category, next payment date, and current status (active, paused, cancelled).
- **Trial Tracking**: Specific tracking for trial periods and when they expire to avoid unwanted charges.
- **Qualitative Metrics**: Users can add personal notes and a "Worth It Rating" to evaluate their subscriptions over time.

## 3. Financial Tracking & Analytics (Dashboard)
- **Global Budgeting**: Users can define a total monthly budget limit.
- **Category-Based Budgets**: Set specific spending limits for individual categories (e.g., Entertainment, Software, Utilities).
- **Budget Alerts**: System tracks and sends alerts when users are approaching or exceeding their set budgets.
- **Analytics View**: Visual breakdown of spending by category and budget utilization.

## 4. History Logging
- **Payment History**: Keeps a historical log of all individual payments made for each subscription.
- **Price History**: Tracks pricing changes over time (e.g., when a streaming service increases its monthly fee) including notes on why the price changed.

## 5. Calendar Integration
- **Subscription Calendar**: A visual calendar view (`/calendar`) to easily see upcoming renewal dates and visualize the monthly payment schedule.

## 6. Reminders & Notifications
- **Email Reminders**: Automated email reminders sent before a subscription is due for renewal.
- **Cron Jobs**: Background jobs run automatically to process and dispatch scheduled reminders.
- **User Preferences**: Users have the ability to toggle email reminders on or off from their settings.

## 7. Data Portability (Import & Export)
- **Export Data**: Users can export their subscription data in multiple formats:
  - **CSV Export**: For spreadsheet analysis.
  - **PDF Export**: For clean, printable reports.
- **Import Data**: Users can bulk upload and import their subscriptions via a CSV file upload.

## 8. UI / UX Enhancements
- **Progressive Web App (PWA)**: Implements service worker registration for potential offline capabilities and installability.
- **Modern Component Library**: Uses Radix UI primitives for accessible, high-quality interactive components (Dropdowns, Dialogs, Tooltips, Tabs, etc.).
- **Dynamic Feedback**: Toast notifications (via Sonner) for successful actions or errors.
- **Micro-interactions**: Uses Canvas Confetti for delightful user interactions (e.g., when hitting a savings goal or completing onboarding).
- **Responsive & Themed**: Fully responsive design with potential support for light/dark modes using Tailwind CSS.
