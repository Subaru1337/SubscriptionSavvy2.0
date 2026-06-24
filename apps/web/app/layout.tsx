import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "sonner";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const dmMono = DM_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "SubscriptionSavvy — Stop Losing Money to Forgotten Subscriptions",
    template: "%s | SubscriptionSavvy",
  },
  description:
    "Track, manage, and optimize all your subscriptions in one place. Never miss a payment or waste money on unused services.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0D7377",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${plusJakartaSans.variable} ${dmMono.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0D7377" />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "var(--card)",
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
              },
            }}
          />
        </ThemeProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
