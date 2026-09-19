import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";
import AccountSession from "@/components/AccountSession";

export const metadata: Metadata = {
  title: "MathMatch",
  description: "Browse olympiad problems at your level and prove the ones you pick.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AccountSession />
        {children}
      </body>
    </html>
  );
}
