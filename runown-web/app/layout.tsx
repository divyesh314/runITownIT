import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import "./globals.css";

// Fonts load via a plain <link>, not next/font/google: next/font fetches
// and self-hosts the font file at *build* time, which isn't reliable in
// every environment (corporate proxies, offline CI, sandboxes - this repo
// has hit exactly that). A runtime <link> only ever needs to be reachable
// in the visitor's browser, which is a much safer bet, at the cost of one
// extra round trip on first load.

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
      <head>
        {/* Applies a remembered light/dark choice before first paint, so
            there's no flash of the wrong theme. Keep STORAGE_KEY in sync
            with components/theme-toggle.tsx. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('runown-theme');" +
              "if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}" +
              "}catch(e){}})();",
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/*
          eslint-disable-next-line @next/next/no-page-custom-font --
          this rule assumes a custom font <link> lives in a per-page
          component; this one is in the *root* layout, so it already
          applies to every route in the app, which is exactly what the
          rule is trying to ensure.
        */}
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-background text-foreground">
        <Nav />
        {children}
      </body>
    </html>
  );
}
