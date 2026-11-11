
import type { Metadata } from "next";
import Sidebar from "@/components/sidebar";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sales Module ERP",
  description: "Sales and Customer Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="h-screen w-screen overflow-hidden">
        <div className="flex h-screen w-screen overflow-hidden bg-slate-100">
          <Sidebar />

          <main className="h-screen min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
