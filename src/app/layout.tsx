import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Providers } from "@/components/Providers";
import { auth } from "@/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Avatar Atelier",
  description: "Buy and sell Live2D models for VTubing",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script 
          src="https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js" 
          strategy="beforeInteractive"
        />
        <Script
            src="https://cdn.jsdelivr.net/gh/dylanNew/live2d/webgl/Live2D/lib/live2d.min.js"
            strategy="beforeInteractive"
        />
        <Providers session={session}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
