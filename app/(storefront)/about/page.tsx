import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";

import AboutExperience from "@/components/about/AboutExperience";
import FeaturesStrip from "@/components/sections/FeaturesStrip";

export const metadata: Metadata = pageMetadata({
  path: "/about",
  title: "About N7 Cosmetics | The Essence of Elegance",
  description:
    "Discover N7 Cosmetics, the first UK company to officially introduce the exquisite fragrances of Yusuf Bhai from the UAE.",
});

export default async function AboutPage() {
  return (
    <>
      <AboutExperience />
      <FeaturesStrip />
    </>
  );
}
