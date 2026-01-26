import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "@/components/providers";
// Import the new AuthGuard
import AuthGuard from "@/components/auth-guard";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Yeti dashboard",
  // description: "Created with v0",
  // ... icons config
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>
          {/* Wrap children with AuthGuard to protect the entire app */}
          <AuthGuard>{children}</AuthGuard>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
