import type { Metadata } from "next";

import AboutExperience from "@/components/about/AboutExperience";
import AboutFeaturedCollection from "@/components/about/AboutFeaturedCollection";
import FeaturesStrip from "@/components/sections/FeaturesStrip";
import { getHomepageStorefrontContent } from "@/lib/commerce/homepage";

export const metadata: Metadata = {
  title: "About N7 Cosmetics | The Essence of Elegance",
  description:
    "Discover N7 Cosmetics, the first UK company to officially introduce the exquisite fragrances of Yusuf Bhai from the UAE.",
};

export default async function AboutPage() {
  const { signatureProducts } = await getHomepageStorefrontContent();

  return (
    <>
      <AboutExperience />
      <AboutFeaturedCollection products={signatureProducts.slice(0, 4)} />
      <FeaturesStrip />
    </>
  );
}
