import type { Metadata, Viewport } from "next";
import { Cinzel, Manrope } from "next/font/google";
import { SerwistProvider } from "@serwist/next/react";
import PwaStatus from "@/components/PwaStatus";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const APP_NAME = "Lebrun Arena";
const APP_DESCRIPTION =
  "Every 2025–26 ping pong match featuring Félix Lebrun or Alexis Lebrun, pulled straight from the WTT Global YouTube channel and ready to watch.";

export const metadata: Metadata = {
  metadataBase: new URL("https://lebrun-arena.vercel.app"),
  applicationName: APP_NAME,
  title: {
    default: "Lebrun Arena — Félix & Alexis Lebrun | Full Matches 2025–26",
    template: "%s — Lebrun Arena",
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-180.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: "Lebrun Arena",
    description: APP_DESCRIPTION,
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512 }],
  },
  twitter: {
    card: "summary",
    title: "Lebrun Arena",
    description: APP_DESCRIPTION,
    images: ["/icons/icon-512.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#04050d",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SerwistProvider swUrl="/sw.js">
          {children}
          <PwaStatus />
        </SerwistProvider>
      </body>
    </html>
  );
}