# SubscriptionSavvy 2.0 - Comprehensive Project Context

## Overview
SubscriptionSavvy is a full-stack, cross-platform subscription management application designed to help users track, analyze, and manage their recurring expenses. The project is organized as a monorepo containing a modern web application and a native mobile application. Both platforms share a unified design system and interface with the same backend architecture to provide a seamless, synchronized user experience.

---

## 1. Project Architecture & Tech Stack

### Monorepo Structure
The project is split into two primary directories within the `apps/` folder:
- `apps/web`: The Next.js web application.
- `apps/mobile`: The Expo React Native mobile application.

### Web Application (`apps/web`)
* **Framework:** Next.js (App Router)
* **Language:** TypeScript
* **Styling:** TailwindCSS with a custom, premium aesthetic. UI micro-interactions and transitions are powered by `framer-motion`.
* **Database & ORM:** Supabase (PostgreSQL) paired with Prisma ORM for type-safe database interactions.
* **Authentication:** Clerk for secure, passwordless, and social login capabilities.
* **Hosting:** Vercel

### Mobile Application (`apps/mobile`)
* **Framework:** Expo (React Native) utilizing the Managed Workflow.
* **Routing:** Expo Router (File-based routing for React Native).
* **Language:** TypeScript
* **Styling:** NativeWind v4 (TailwindCSS for React Native), compiled via LightningCSS.
* **Animations:** `react-native-reanimated` and `expo-video` (used for a seamless video splash screen).
* **Network & Data:** Axios with interceptors to automatically append secure tokens stored in `expo-secure-store`.
* **Deployment:** Built and distributed via Expo Application Services (EAS).

---

## 2. Design System & Aesthetics
SubscriptionSavvy prioritizes a premium, polished user experience.
* **Brand Colors:** The primary theme is a custom deep teal (`#0D7377`) paired with a lighter teal accent (`#14A085`), moving away from generic greens to establish a sophisticated financial aesthetic. 
* **Backgrounds & Cards:** Interfaces utilize soft off-whites (`#FAFAFA` and `#F4F6F9`) with crisp white (`#FFFFFF`) elevated cards, subtle borders, and soft drop shadows.
* **Typography:** `Plus Jakarta Sans` is used exclusively across the mobile app for a modern, highly legible geometric sans-serif look.
* **UX Details:** Data fetches are masked with animated Skeleton Loaders rather than basic loading spinners. The mobile app boots up with a custom Native OS splash screen that transitions seamlessly into an animated `.mp4` video splash.

---

## 3. Core Features

### Dashboard
* **Spending Overview:** Displays total monthly expenditure calculated in the user's base currency.
* **Upcoming Renewals:** A timeline/list highlighting subscriptions due in the next few days.
* **Visual Rings:** Animated circular progress rings showing budget utilization.

### Subscriptions Management
* **List View:** Searchable and filterable (by category) list of all subscriptions. Sorting logic is strictly prioritized: `Active` subscriptions are pinned to the top, followed by `Paused`, and finally `Cancelled`. Ties are broken by the nearest payment date.
* **CRUD Operations:** Users can add, edit, pause, or cancel subscriptions. Fields include Name, Cost, Currency, Category, Billing Cycle, Next Payment Date, and Trial tracking.
* **Multi-Currency:** Subscriptions can be entered in various currencies, and the app utilizes exchange rates to normalize the display against the user's chosen base currency.

### Analytics & Insights
* Provides charts and detailed breakdowns of spending habits categorized by type (Entertainment, Productivity, Health, etc.).
* Historical spending data and future projection logic.

### Settings & User Preferences
* **Base Currency:** Users can toggle their preferred base currency (e.g., USD, EUR, INR) which recalculates all dashboard values.
* **Notifications:** Toggles for Push Notifications and Email Reminders for upcoming bills.
* **Data Export:** Secure generation and downloading of financial data in CSV or PDF formats. (Mobile uses `expo-file-system` with secure authorization headers to fetch the file, bypassing browser URL security risks).

---

## 4. Notable Engineering Implementations & Fixes

* **Secure File Exports:** Initial implementations of file exports passed auth tokens via URL parameters, which is a security risk. This was re-engineered so the mobile app uses internal network requests with standard `Bearer` auth headers, downloading the file to the local filesystem using `expo-file-system/legacy` and triggering native share sheets via `expo-sharing`.
* **NativeWind EAS Build Compatibility:** Building NativeWind v4 on Expo EAS (Linux) from a Windows-generated `package-lock.json` caused a `Cannot find module lightningcss.linux-x64-gnu.node` error. This was resolved by injecting `"eas-build-pre-install": "npm install lightningcss-linux-x64-gnu"` into the mobile `package.json`.
* **Splash Screen Harmony:** The mobile app's `app.json` is configured to show a static `splash-icon.png` matching the background color of the first frame of the `splash.mp4` video. When the JS engine boots, the static image transitions perfectly into the video playback.
* **Branding Overrides:** Standard Expo adaptive icons were removed from the `android` section of `app.json` to ensure the custom `icon.png` is used, and the app name is strictly set to `Subsavvy` to ensure clean home screen installations.

---

## 5. Deployment Pipelines
* **Web:** Automatically deployed to Vercel upon pushes to the `main` branch.
* **Mobile (Android):** Built as an APK using Expo Application Services (`eas build -p android --profile preview`). The generated APK URL is typically linked directly to the web application's landing page for seamless user downloads.
* **Mobile (iOS):** Managed via standard EAS build commands aimed at TestFlight / App Store Connect.
