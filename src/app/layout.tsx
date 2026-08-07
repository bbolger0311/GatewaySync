import type { Metadata } from "next";
import { Geist, Geist_Mono, Manrope } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const logoFont = Manrope({
  variable: "--font-logo",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "GatewaySync",
  description: "One consolidated platform for submitting invoices to your procurement portals.",
};

// Applies the .dark class (Tailwind's class-based dark variant, see
// globals.css) to match the visitor's OS-level color scheme preference.
// Runs as a blocking inline script so it takes effect before first paint —
// no flash of the wrong theme — and listens for live OS-preference changes.
const THEME_SCRIPT = `(function(){try{var m=window.matchMedia('(prefers-color-scheme: dark)');function apply(){document.documentElement.classList.toggle('dark',m.matches);}apply();m.addEventListener('change',apply);}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${logoFont.variable} h-full antialiased`}
      >
        <head>
          <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        </head>
        <body className="min-h-full flex flex-col">{children}</body>
      </html>
    </ClerkProvider>
  );
}
