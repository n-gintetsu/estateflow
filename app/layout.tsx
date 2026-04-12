import type { Metadata } from "next";
import SidebarLayout from "./layout-sidebar";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EstateFlow | GINTETSU不動産",
  description: "GINTETSU不動産 スタッフ管理システム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-9GL11H1C10" strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-9GL11H1C10');
      `}</Script>
      <body className="min-h-full flex flex-col"><SidebarLayout>{children}</SidebarLayout></body>
    </html>
  );
}
