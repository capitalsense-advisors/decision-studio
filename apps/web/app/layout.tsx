import type { Metadata, Viewport } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { BrandLogo } from "@/components/brand-logo";
import { PrimaryNav } from "@/components/primary-nav";
import { ThemeControl } from "@/components/theme-control";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Paisaan by CapitalSense", template: "%s | Paisaan" },
  description: "Clear, beautifully designed financial decisions for the life you are building.",
};

export const viewport: Viewport = {
  width: "device-width", initialScale: 1, colorScheme: "light dark",
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f3f2ed" }, { media: "(prefers-color-scheme: dark)", color: "#0c0f12" }],
};

const themeScript = `(function(){try{var p=localStorage.getItem('decision-studio-theme')||'system';var d=p==='dark'||(p==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.style.colorScheme=d?'dark':'light'}catch(e){}})()`;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head><body>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <div className="app-shell">
      <header className="site-header">
        <Link href="/" className="brand" aria-label="Paisaan home"><BrandLogo /></Link>
        <p className="product-label"><i /> No account required</p>
      </header>
      <div className="nav-shell"><PrimaryNav /></div>
      <main id="main-content">{children}</main>
      <footer><span><b>Paisaan</b> helps you think clearly. It does not execute trades or replace professional advice.</span><ThemeControl /></footer>
    </div>
  </body></html>;
}
