import type { Metadata } from "next";
import { Outfit, Syne } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["600", "700", "800"],
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "EaseLink — 短連結，基本版與專業版",
  description: "香港短連結服務：免費基本版 + 專業版付款升級，支援自訂短碼與點擊統計。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body className={`${syne.variable} ${outfit.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
