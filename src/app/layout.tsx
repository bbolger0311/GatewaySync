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

const SITE_DESCRIPTION =
  "GatewaySync consolidates Coupa, Ariba, Procurify, Zycus, AvidXchange, Tipalti, Ramp, and Stampli into one dashboard — link your procurement portals once and submit invoices from a single place.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.gateway-sync.com"),
  title: {
    default: "GatewaySync — Many Portals, One Gateway",
    template: "%s | GatewaySync",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: "GatewaySync — Many Portals, One Gateway",
    description: SITE_DESCRIPTION,
    siteName: "GatewaySync",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "GatewaySync — Many Portals, One Gateway",
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// Applies the .dark class (Tailwind's class-based dark variant, see
// globals.css) to match the visitor's OS-level color scheme preference.
// Runs as a blocking inline script so it takes effect before first paint —
// no flash of the wrong theme — and listens for live OS-preference changes.
const THEME_SCRIPT = `(function(){try{var m=window.matchMedia('(prefers-color-scheme: dark)');function apply(){document.documentElement.classList.toggle('dark',m.matches);}apply();m.addEventListener('change',apply);}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "var(--primary)",
          colorText: "var(--foreground)",
          colorTextSecondary: "var(--muted-foreground)",
          colorBackground: "var(--background)",
          colorInputText: "var(--foreground)",
          colorInputBackground: "var(--background)",
          colorNeutral: "var(--foreground)",
        },
        elements: {
          organizationSwitcherTrigger: { color: "var(--foreground)" },
          organizationSwitcherTriggerIcon: { color: "var(--foreground)" },
          organizationPreviewMainIdentifier: { color: "var(--foreground)" },
          organizationPreviewSecondaryIdentifier: { color: "var(--muted-foreground)" },
          userButtonTrigger: { color: "var(--foreground)" },
          userButtonOuterIdentifier: { color: "var(--foreground)" },
        },
      }}
    >
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
