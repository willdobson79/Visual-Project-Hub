import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import LayoutClient from "@/components/layout/LayoutClient";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Project Canvas | Visual Project Management",
  description: "Sophisticated visual project management application with mind-mapping, hierarchical workspaces, and local-first synchronization.",
  keywords: ["visual project management", "mind map cards", "visual workspace", "project canvas"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased text-slate-100`}>
        <LayoutClient>
          {children}
        </LayoutClient>
      </body>
    </html>
  );
}
