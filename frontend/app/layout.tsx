import type { Metadata } from "next";
import Link from "next/link";
import AuthNav from "@/components/AuthNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Harmoniq",
  description: "Stem-level music ownership, verified on-chain.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;700&display=swap"
        />
      </head>
      <body>
        <header className="nav">
          <Link href="/" className="logo">Harmoniq</Link>
          <AuthNav />
        </header>
        {children}
      </body>
    </html>
  );
}
