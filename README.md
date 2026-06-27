<p align="center">
  <img src="apps/mobile/assets/icon.png" alt="Subsavvy Logo" width="120" height="120" style="border-radius: 24px;" />
</p>

<h1 align="center">Subsavvy</h1>

<p align="center">
  <strong>Track Subscriptions like never before.</strong>
</p>

<p align="center">
  A full-stack, cross-platform subscription management app built with Next.js & React Native.
</p>

<p align="center">
  <a href="https://subsavvy.framer.website">🌐 Website</a> &nbsp;·&nbsp;
  <a href="https://subscription-savvy2-0-web.vercel.app">🖥️ Web App</a> &nbsp;·&nbsp;
  <a href="https://subsavvy.framer.website">📱 Download APK</a>
</p>

---

## ✨ What is Subsavvy?

Subsavvy is a modern subscription tracker that gives you a clear picture of where your money goes every month. Add your subscriptions, set budgets by category, get renewal reminders, and export your data — all from a beautifully designed dashboard available on both web and mobile.

---

## 🖼️ Screenshots

> _Coming soon — add your own screenshots here!_

---

## 🚀 Features

| Feature | Web | Mobile |
|---|:---:|:---:|
| Dashboard with spending overview | ✅ | ✅ |
| Add / Edit / Pause / Cancel subscriptions | ✅ | ✅ |
| Multi-currency support with conversion | ✅ | ✅ |
| Category-wise spending analytics | ✅ | ✅ |
| Budget tracking with visual progress | ✅ | ✅ |
| Renewal calendar view | ✅ | ✅ |
| Export data (CSV & PDF) | ✅ | ✅ |
| Push notification reminders | — | ✅ |
| Email reminders | ✅ | ✅ |
| Pull-to-refresh | — | ✅ |
| Animated video splash screen | — | ✅ |
| Skeleton loaders | ✅ | ✅ |

---

## 🏗️ Tech Stack

### Web App
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS + Framer Motion
- **Database:** Supabase (PostgreSQL)
- **ORM:** Prisma
- **Auth:** Clerk
- **Hosting:** Vercel

### Mobile App
- **Framework:** React Native (Expo)
- **Routing:** Expo Router
- **Language:** TypeScript
- **Styling:** NativeWind v4 (TailwindCSS for RN)
- **Auth Storage:** Expo SecureStore
- **Animations:** React Native Reanimated + Expo Video
- **Build & Deploy:** Expo Application Services (EAS)

### Monorepo
- **Package Manager:** npm Workspaces
- **Build Orchestration:** Turborepo

---

## 📂 Project Structure

```
SubscriptionSavvy2.0/
├── apps/
│   ├── web/                    # Next.js web application
│   │   ├── app/                # App Router pages & API routes
│   │   │   ├── api/            # Backend API endpoints
│   │   │   ├── dashboard/      # Dashboard page
│   │   │   └── ...
│   │   ├── components/         # Reusable UI components
│   │   ├── prisma/             # Prisma schema & migrations
│   │   └── public/             # Static assets
│   │
│   └── mobile/                 # Expo React Native app
│       ├── app/                # Expo Router screens
│       │   ├── (tabs)/         # Tab navigation screens
│       │   │   ├── index.tsx           # Dashboard
│       │   │   ├── subscriptions.tsx   # Subscriptions list
│       │   │   ├── calendar.tsx        # Calendar view
│       │   │   ├── analytics.tsx       # Analytics / Insights
│       │   │   └── settings.tsx        # Settings
│       │   ├── add-subscription.tsx    # Add subscription modal
│       │   └── subscription/[id].tsx   # Subscription detail
│       ├── components/         # Shared mobile components
│       ├── lib/                # API client, utilities
│       └── assets/             # Icons, splash video, fonts
│
├── package.json                # Root workspace config
├── turbo.json                  # Turborepo config
└── eas.json                    # EAS Build config
```

---

## ⚡ Getting Started

### Prerequisites
- Node.js 18+
- npm
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`) — for mobile builds

### 1. Clone the repository
```bash
git clone https://github.com/Subaru1337/SubscriptionSavvy2.0.git
cd SubscriptionSavvy2.0
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
```bash
cp .env.example .env
```
Fill in your Supabase, Clerk, and database credentials in the `.env` file.

### 4. Run the web app
```bash
cd apps/web
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Run the mobile app
```bash
cd apps/mobile
npx expo start
```
Scan the QR code with Expo Go or run on an emulator.

---

## 📦 Building for Production

### Web
The web app auto-deploys to Vercel on pushes to `main`.

### Mobile (Android APK)
```bash
cd apps/mobile
eas build -p android --profile preview
```
This generates a downloadable `.apk` link via Expo's cloud build servers.

---

## 🔗 Links

| Resource | URL |
|---|---|
| 🌐 Landing Page | [subsavvy.framer.website](https://subsavvy.framer.website) |
| 🖥️ Web App | [subscription-savvy2-0-web.vercel.app](https://subscription-savvy2-0-web.vercel.app) |
| 📱 Download APK | Available on the [landing page](https://subsavvy.framer.website) |

---

## 📄 License

This project is for educational and portfolio purposes.

---

<p align="center">
  Built with ☕ and too many subscriptions.
</p>
