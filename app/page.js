import HeroSection from "../components/sections/HeroSection";
import FragranceOfWeek from "../components/sections/FragranceOfWeek";
import SignatureFragrances from "../components/sections/SignatureFragrances";
import IconicDuo from "../components/sections/IconicDuo";
import CategoryShowcase from "../components/sections/CategoryShowcase";
import RecreationsSlider from "../components/sections/RecreationsSlider";
import AudienceCollections from "../components/sections/AudienceCollections";
import ReviewsSection from "../components/sections/ReviewsSection";
import FeaturesStrip from "../components/sections/FeaturesStrip";

export default function Home() {
  return (
    <>
      <HeroSection />
      <FragranceOfWeek />
      <SignatureFragrances />
      <IconicDuo />
      <CategoryShowcase />
      <RecreationsSlider />
      <AudienceCollections />
      <ReviewsSection />
      <FeaturesStrip />
    </>
  );
}
