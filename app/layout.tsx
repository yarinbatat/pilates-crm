import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Pilates CRM",
  description: "SaaS management for a Pilates & Nutrition studio",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}

