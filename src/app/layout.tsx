
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Capstone Team Management Portal",
    template: "%s | Capstone Portal",
  },
  description:
    "A centralized platform for capstone team registration, mentor assignment and registration tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} min-h-full antialiased`}
    >
      <body className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
        <Navbar />

        <main className="flex-1">{children}</main>

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-5 py-6 text-sm text-slate-500 sm:flex-row sm:px-8">
            <p className="font-semibold text-slate-700">
              Capstone Team Management Portal
            </p>
            <p>Academic Project · Team Registration & Management</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
