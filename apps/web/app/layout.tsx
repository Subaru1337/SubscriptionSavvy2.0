import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "SubscriptionSavvy — Smart Subscription Tracker",
  description: "Track, manage, and optimize all your recurring subscriptions and payments in one beautiful dashboard.",
  keywords: ["subscription tracker", "recurring payments", "budget management", "SaaS tracker"],
  authors: [{ name: "SubscriptionSavvy" }],
  openGraph: {
    title: "SubscriptionSavvy 2.0",
    description: "Your subscriptions, beautifully managed.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0D1117",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-base text-text antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
