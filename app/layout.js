import { Outfit, Playfair_Display } from "next/font/google";
import localFont from "next/font/local";
import AppShell from "../components/layout/AppShell";
import SmoothScroller from "../components/layout/SmoothScroller";
import "./globals.css";

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
    }
  ]
})

export const metadata = {
  title: "N7 Cosmetics | Luxury Signature Fragrances",
  description: "Discover the pinnacle of luxury perfumery. Handcrafted signature fragrances, exquisite recreations, and curated collections designed for distinct personalities.",
  keywords: ["luxury perfume", "fragrance", "N7 Cosmetics", "signature scent", "cologne", "parfum", "UK perfumes"],
  openGraph: {
    title: "N7 Cosmetics | Luxury Signature Fragrances",
    description: "Discover the pinnacle of luxury perfumery. Handcrafted signature fragrances.",
    url: "https://n7cosmetics.co.uk",
    siteName: "N7 Cosmetics",
    locale: "en_GB",
    type: "website",
  }
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${outfit.variable} ${kindred.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-dark-950 text-dark-50 font-body">
        <SmoothScroller>
          <AppShell>
            {children}
          </AppShell>
        </SmoothScroller>
      </body>
    </html>
  );
}
