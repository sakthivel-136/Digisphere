// app/layout.tsx

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import NavbarClient from "@/app/components/navbar/NavbarClient";
import NavbarWrapper from "@/app/components/navbar/NavbarWrapper";
import NextTopLoader from 'nextjs-toploader';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Security-Verifier Dashboard",
  description: "Modern admin panel for Security-Verifier system",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body
        className={`
          ${geistSans.variable}
          ${geistMono.variable}
          min-h-screen
          flex
          flex-col
          antialiased
          bg-background
          text-foreground
        `}
      >
        <NextTopLoader color="var(--primary)" showSpinner={false} shadow="0 0 10px var(--primary),0 0 5px var(--primary)" />
        {/* Navbar (hidden on home page via NavbarWrapper logic) */}
        <NavbarWrapper>
          <NavbarClient />
        </NavbarWrapper>

        {/* Page Content */}
        <main className="flex-1 flex flex-col min-h-[calc(100vh-64px)] w-full">
          {children}
        </main>
      </body>
    </html>
  );
}
