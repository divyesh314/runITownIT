import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import "./globals.css";

// Deliberately using the system font stack (see globals.css) rather than
// next/font/google's Geist: fetching fonts from Google at build time isn't
// reliable in every environment (corporate proxies, offline CI, sandboxes),
// and a project this early doesn't need a custom typeface yet.

export const metadata: Metadata = {
  title: "RunOwn — Run It. Own It.",
  description:
    "Claim city territory by running through it, defend it, and see who owns your city.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
        <Nav />
        {children}
      </body>
    </html>
  );
}
