import type { Metadata } from "next";
import { Nav } from "@/components/common/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Interactive OS Resource Contention Sandbox & Scheduling Analyzer",
  description: "Interactive OS Resource Contention Sandbox & Scheduling Analyzer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#FAFAF7] text-[#1A1A1A]">
        <Nav />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}

