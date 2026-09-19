import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";
import AccountSession from "@/components/AccountSession";

export const metadata: Metadata = {
  title: "MathMatch",
  description: "Swipe through olympiad problems and prove the ones you match with.",
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
