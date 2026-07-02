import HeroSection from "../components/sections/HeroSection";
import SignatureFragrances from "../components/sections/SignatureFragrances";
import CategoryShowcase from "../components/sections/CategoryShowcase";
import RecreationsSlider from "../components/sections/RecreationsSlider";
import ReviewsSection from "../components/sections/ReviewsSection";
import FeaturesStrip from "../components/sections/FeaturesStrip";

export default function Home() {
  return (
    <>
      <HeroSection />
      <SignatureFragrances />
      <CategoryShowcase />
      <RecreationsSlider />
      <ReviewsSection />
      <FeaturesStrip />
    </>
  );
}
