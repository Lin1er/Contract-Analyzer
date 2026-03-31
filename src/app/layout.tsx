import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/Providers";
import { JsonLd } from "@/components/JsonLd";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_NAME = "ClearContract";
const APP_DESCRIPTION =
  "Upload your legal contracts and get instant AI analysis to identify red flags, hidden fees, and problematic clauses in simple, easy-to-understand language.";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://clearcontract.app";

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} - AI-Powered Contract Analysis`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    "contract analysis",
    "legal tech",
    "AI",
    "red flags",
    "contract review",
    "legal document analysis",
    "contract analyzer",
    "hidden fees detection",
    "legal AI",
    "analisis kontrak",
    "dokumen hukum",
  ],
  authors: [{ name: APP_NAME }],
  creator: APP_NAME,
  publisher: APP_NAME,
  metadataBase: new URL(APP_URL),
  alternates: {
    canonical: "/",
    languages: {
      en: "/",
      id: "/",
    },
  },
  openGraph: {
    title: `${APP_NAME} - AI-Powered Contract Analysis`,
    description:
      "Make reading contracts stress-free. Get instant AI analysis to identify red flags and problematic clauses.",
    type: "website",
    locale: "en_US",
    alternateLocale: "id_ID",
    siteName: APP_NAME,
    url: APP_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} - AI-Powered Contract Analysis`,
    description:
      "Make reading contracts stress-free. Get instant AI analysis to identify red flags and problematic clauses.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Theme initialization script to prevent flash
  const themeScript = `
    (function() {
      try {
        var theme = localStorage.getItem('theme');
        var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (theme === 'dark' || (theme === 'system' && systemDark) || (!theme && systemDark)) {
          document.documentElement.classList.add('dark');
        }
      } catch (e) {}
    })();
  `;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <meta
          name="google-site-verification"
          content="jJHGCMuoy94jnBqTSb921m99iNlXYSH5YDjl1YJnpxI"
        />{" "}
        <script
          dangerouslySetInnerHTML={{ __html: themeScript }}
          suppressHydrationWarning
        />
      </head>
      <body
        className="min-h-full flex flex-col bg-background"
        suppressHydrationWarning
      >
        <JsonLd />
        <Providers>{children}</Providers>
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
