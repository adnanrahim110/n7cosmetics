import HeroSection from "../components/sections/HeroSection";
import FragranceOfWeek from "../components/sections/FragranceOfWeek";
import SignatureFragrances from "../components/sections/SignatureFragrances";
import IconicDuo from "../components/sections/IconicDuo";
import CategoryShowcase from "../components/sections/CategoryShowcase";
import RecreationsSlider from "../components/sections/RecreationsSlider";
import AudienceCollections from "../components/sections/AudienceCollections";
import BrandFilmSection from "../components/sections/BrandFilmSection";
import ReviewsSection from "../components/sections/ReviewsSection";
import ScentStorySection from "../components/sections/ScentStorySection";
import FeaturesStrip from "../components/sections/FeaturesStrip";

export default function Home() {
  return (
    <>
      <HeroSection />
      <FragranceOfWeek />
      <BrandFilmSection />
      <SignatureFragrances />
      <IconicDuo />
      <CategoryShowcase />
      <ScentStorySection />
      <RecreationsSlider />
      <AudienceCollections />
      <ReviewsSection />
      <FeaturesStrip />
    </>
  );
}
