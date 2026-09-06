import type { Metadata } from "next";
import { Cinzel, Manrope } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Lebrun Arena — Félix & Alexis Lebrun | Full Matches 2025–26",
  description:
    "Every 2025–26 ping pong match featuring Félix Lebrun or Alexis Lebrun, pulled straight from the WTT Global YouTube channel and ready to watch.",
  openGraph: {
    title: "Lebrun Arena",
    description:
      "Every 2025–26 Félix & Alexis Lebrun ping pong match from WTT Global. Watch full matches instantly.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}