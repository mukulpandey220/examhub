import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FloatingFullscreenButton } from "@/components/FloatingFullscreenButton";
import { PageMain } from "@/components/PageMain";
import { NavigationProgress } from "@/components/NavigationProgress";
import { PointerGlow } from "@/components/PointerGlow";
import { BackgroundGrid } from "@/components/BackgroundGrid";
import { PlayfulAvatar3D } from "@/components/PlayfulAvatar3D";

/* Body / UI text */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f7f5" },
    { media: "(prefers-color-scheme: dark)", color: "#070d24" },
  ],
};

export const metadata: Metadata = {
  title: "Exam Hub | Campus Assessment Hub & Deadline Radar",
  description: "Exam Hub - Comprehensive examination, practice test, self-payment gateway, and student/admin portal across 72 academic domains.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.ico",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Exam Hub",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
  },
};

/**
 * Runs before first paint so the saved theme is applied with no flash.
 * Light is the default; a visitor's saved choice always wins.
 */
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full ${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,400&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col text-slate-900 antialiased font-sans relative">
        <BackgroundGrid />
        <a href="#main-content" className="skip-link">Skip to content</a>
        <PointerGlow />
        <NavigationProgress />
        <Navbar />
        <PageMain>{children}</PageMain>
        <Footer />
        <FloatingFullscreenButton />
        <PlayfulAvatar3D />
      </body>
    </html>
  );
}
