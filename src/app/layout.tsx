import type { Metadata } from "next";
import { Mona_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner";

const monaSans = Mona_Sans({
  variable: "--font-mona-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Interview.ly",
  description: "An Interview Preparation Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${monaSans.variable} antialiased pattern`}>
        <Navbar />
        <main className="min-h-[60vh]">{children}</main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}