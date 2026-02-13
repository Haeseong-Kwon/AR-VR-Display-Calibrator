import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Guardion | AR/VR Display Calibrator",
  description: "Next-generation display correction and calibration system for high-end spatial computing devices.",
  openGraph: {
    title: "Guardion Display Calibrator",
    description: "Professional AI-driven display calibration for AR/VR",
    images: [
      {
        url: "https://github.com/Haeseong-Kwon/AR-VR-Display-Calibrator/raw/main/public/og-image.png",
        width: 1200,
        height: 630,
        alt: "Guardion Interface Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Guardion | AR/VR Display Calibrator",
    description: "Professional AI-driven display calibration for AR/VR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black selection:bg-blue-500/30`}
      >
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,#1d4ed815_0%,transparent_50%)] pointer-events-none" />
        {children}
      </body>
    </html>
  );
}
