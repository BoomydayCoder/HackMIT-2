import type { Metadata, Viewport } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";
import AccountSession from "@/components/AccountSession";
import Arena from "@/components/Arena";
import TabBar from "@/components/TabBar";

export const metadata: Metadata = {
  title: "MathMatch",
  description: "Duel olympiad problems: flee the ones you can't take, prove the ones you fight.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Arena />
        <AccountSession />
        {children}
        <TabBar />
      </body>
    </html>
  );
}
