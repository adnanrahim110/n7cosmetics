import AudienceCollections from "@/components/sections/AudienceCollections";
import BrandFilmSection from "@/components/sections/BrandFilmSection";
import FeaturesStrip from "@/components/sections/FeaturesStrip";
import FragranceOfWeek from "@/components/sections/FragranceOfWeek";
import HeroSection from "@/components/sections/HeroSection";
import RecreationsSlider from "@/components/sections/RecreationsSlider";
import ReviewsSection from "@/components/sections/ReviewsSection";
import ScentStorySection from "@/components/sections/ScentStorySection";
import SignatureFragrances from "@/components/sections/SignatureFragrances";
import { getHomepageStorefrontContent } from "@/lib/commerce/homepage";

export default async function Home() {
  const content = await getHomepageStorefrontContent();
  const { configuration } = content;
  return (
    <>
      <HeroSection
        content={configuration.hero}
        products={content.heroProducts}
      />
      <SignatureFragrances
        content={configuration.signature}
        products={content.signatureProducts}
      />
      <BrandFilmSection film={configuration.brandFilm} />
      <RecreationsSlider
        content={configuration.recreations}
        products={content.recreationProducts}
      />
      <FragranceOfWeek
        content={configuration.weekly}
        product={content.weeklyProduct}
      />
      <ScentStorySection story={configuration.scentStory} />
      <AudienceCollections content={configuration.audience} />
      <ReviewsSection content={configuration.reviews} />
      <FeaturesStrip content={configuration.features} />
    </>
  );
}
