import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Unified OTT Platform",
  description: "Netflix + Prime + JioHotstar inspired OTT platform"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-gray-50">{children}</body>
    </html>
  );
}
