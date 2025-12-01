import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Bebas_Neue, Inter, Roboto_Mono } from "next/font/google";

import "./globals.css";
import { Header } from "@/components/header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-heading",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const mono = Roboto_Mono({ subsets: ["latin"], variable: "--font-mono" });

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "R.A.G.E",
  description: "Your modern ordering platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bebas.variable} ${inter.variable} ${mono.variable} antialiased min-h-screen bg-fixed bg-cover bg-center text-[#1a1410] transition-colors duration-300`}
        style={{
          backgroundImage: "url('/images/foto_rage.png')",
          backgroundSize: "cover",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="fixed inset-0 bg-black/50 pointer-events-none z-0" />
        <div className="relative z-10">
          <Header />
          {children}
        </div>
      </body>
    </html>
  );
}
