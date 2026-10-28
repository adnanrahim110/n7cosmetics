import { officialDistributor } from "@/lib/official-distributor";
import DistributorLink from "./DistributorLink";
import DistributorSection from "./DistributorSection";

export default function ShopFragrancesSection() {
  return (
    <DistributorSection
      id="shop-authentic-fragrances"
      title="Shop Authentic Yusuf Bhai Perfumes in the UK"
    >
      <p>
        Explore Yusuf Bhai Original fragrances, Inspired By perfumes and premium
        fragrance collections at N7 Cosmetics.
      </p>
      <div className="flex flex-wrap items-center gap-4 sm:gap-8">
        <DistributorLink href="/yusuf-bhai-originals" variant="primary">
          Shop Yusuf Bhai perfumes
        </DistributorLink>
        <DistributorLink href="/contact">Contact our team</DistributorLink>
      </div>
      <p>
        <strong className="font-medium text-primary-950">Official Website:</strong>{" "}
        <DistributorLink href={officialDistributor.website}>
          {officialDistributor.website}
        </DistributorLink>
      </p>
      <p className="text-sm font-medium text-primary-950">
        N7 Cosmetics Limited – UK Company Number {officialDistributor.companyNumber}
      </p>
    </DistributorSection>
  );
}
