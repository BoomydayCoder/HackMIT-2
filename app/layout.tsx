import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "rigor.ai",
  description: "A home for focused Olympiad practice.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
