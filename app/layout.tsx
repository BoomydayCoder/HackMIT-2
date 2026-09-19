import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";
import AccountSession from "@/components/AccountSession";

export const metadata: Metadata = {
  title: "MathMatch",
  description: "Duel olympiad problems: flee the ones you can't take, prove the ones you fight.",
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
