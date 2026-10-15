import AudienceCollections from "@/components/sections/AudienceCollections";
import BestSellers from "@/components/sections/BestSellers";
import BrandFilmSection from "@/components/sections/BrandFilmSection";
import FaqsSection from "@/components/sections/FaqsSection";
import FeaturesStrip from "@/components/sections/FeaturesStrip";
import FragranceOfWeek from "@/components/sections/FragranceOfWeek";
import HeroSection from "@/components/sections/HeroSection";
import RecreationsSlider from "@/components/sections/RecreationsSlider";
import ReviewsSection from "@/components/sections/ReviewsSection";
import ScentStorySection from "@/components/sections/ScentStorySection";
import SignatureFragrances from "@/components/sections/SignatureFragrances";
import { getHomepageStorefrontContent } from "@/lib/commerce/homepage";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";

const homepageTitle =
  "Yusuf Bhai Perfumes UK | N7 Cosmetics Official Distributor";
const homepageDescription =
  "Shop Yusuf Bhai perfumes in the UK from N7 Cosmetics, an official distributor. Explore Yusuf Bhai Originals and expertly recreated fragrance profiles.";

export const metadata: Metadata = pageMetadata({
  title: homepageTitle,
  description: homepageDescription,
  path: "/",
});

export default async function Home() {
  const content = await getHomepageStorefrontContent();
  const { configuration } = content;
  return (
    <>
      <BrandFilmSection film={configuration.brandFilm} />
      <BestSellers products={content.bestSellerProducts} />
      <SignatureFragrances
        content={configuration.signature}
        products={content.signatureProducts}
      />
      <RecreationsSlider
        content={configuration.recreations}
        products={content.recreationProducts}
      />
      <AudienceCollections content={configuration.audience} />
      <FragranceOfWeek
        content={configuration.weekly}
        product={content.weeklyProduct}
      />
      {/* <HeroSection
        content={configuration.hero}
        products={content.heroProducts}
      /> */}
      <ReviewsSection content={configuration.reviews} />
      <ScentStorySection story={configuration.scentStory} />
      <FaqsSection content={configuration.faqs} />
      <FeaturesStrip content={configuration.features} />
    </>
  );
}
