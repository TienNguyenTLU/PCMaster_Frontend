import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import ChatbotWidget from "@/components/chatbot/ChatbotWidget";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PCMaster – Hệ thống lắp ráp PC & Linh kiện chính hãng",
  description: "Công cụ thiết kế cấu hình PC chuyên nghiệp, tối ưu hiệu năng và quản lý linh kiện phần cứng hàng đầu.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="top-right" />
        <ChatbotWidget />
      </body>
    </html>
  );
}
