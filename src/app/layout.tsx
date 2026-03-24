import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ChronoMap — Explore History Through Time & Space",
  description:
    "An interactive world map that lets you explore historical events by location and time period. Add your own events and build a personal memory map.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased dark`}>
      <body className="min-h-full bg-gray-950 text-white font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
