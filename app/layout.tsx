import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Trading Terminal — Market Study Cockpit",
  description:
    "A Bloomberg-inspired market terminal for studying equities, ETFs, indices, crypto and FX — live quotes, charts, fundamentals and news.",
  applicationName: "Trading Terminal",
  authors: [{ name: "St3althWarri0r" }],
  keywords: ["stocks", "markets", "terminal", "finance", "charts", "trading"],
};

export const viewport: Viewport = {
  themeColor: "#05080b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plexMono.variable} h-full`}>
      <body className="h-full antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
