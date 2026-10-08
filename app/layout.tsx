import type { Metadata } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import "./globals.css";
import MotionProvider from "@/components/layout/MotionProvider";
import { pageMetadata } from "@/lib/metadata";

const siteUrl = (process.env.APP_URL || "https://n7cosmetics.co.uk").replace(
  /\/$/,
  "",
);

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const kindred = localFont({
  preload: false,
  variable: "--font-kindred",
  src: [
    {
      path: "../public/kindred-font/Kindred-WpRM4.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/kindred-font/KindredItalic-e9L0g.ttf",
      weight: "400",
      style: "italic",
    },
  ],
});

export const metadata: Metadata = {
  ...pageMetadata({
    title: "N7 Cosmetics | Luxury Signature Fragrances",
    description:
      "Discover the pinnacle of luxury perfumery. Handcrafted signature fragrances, exquisite recreations, and curated collections designed for distinct personalities.",
    path: "/",
  }),
  metadataBase: new URL(siteUrl),
  alternates: null,
  verification: {
    google: "x3NyolxUdMKJ6dVQVCYDseHpWVGMlBYfE3_W-TTnLEc",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${outfit.variable} ${kindred.variable} h-full antialiased`}
    >
      <body className=" bg-dark-950 text-dark-50 font-body"><MotionProvider>{children}</MotionProvider></body>
    </html>
  );
}
