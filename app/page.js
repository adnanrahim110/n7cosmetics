import AudienceCollections from "../components/sections/AudienceCollections";
import BrandFilmSection from "../components/sections/BrandFilmSection";
import CategoryShowcase from "../components/sections/CategoryShowcase";
import FeaturesStrip from "../components/sections/FeaturesStrip";
import FragranceOfWeek from "../components/sections/FragranceOfWeek";
import HeroSection from "../components/sections/HeroSection";
import IconicDuo from "../components/sections/IconicDuo";
import RecreationsSlider from "../components/sections/RecreationsSlider";
import ReviewsSection from "../components/sections/ReviewsSection";
import ScentStorySection from "../components/sections/ScentStorySection";
import SignatureFragrances from "../components/sections/SignatureFragrances";

export default function Home() {
  return (
    <>
      <HeroSection />
      <SignatureFragrances />
      <BrandFilmSection />
      <RecreationsSlider />
      <FragranceOfWeek />
      {/* <IconicDuo /> */}
      {/* <CategoryShowcase /> */}
      <ScentStorySection />
      <AudienceCollections />
      <ReviewsSection />
      <FeaturesStrip />
    </>
  );
}
