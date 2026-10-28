import type { Metadata } from "next";
import AuthenticitySection from "@/components/distributor/AuthenticitySection";
import BrandIdentitySection from "@/components/distributor/BrandIdentitySection";
import BusinessOverviewSection from "@/components/distributor/BusinessOverviewSection";
import CompanyRegistrationSection from "@/components/distributor/CompanyRegistrationSection";
import DistributorFaqSection from "@/components/distributor/DistributorFaqSection";
import DistributorHero from "@/components/distributor/DistributorHero";
import DistributorStatusSection from "@/components/distributor/DistributorStatusSection";
import ShopFragrancesSection from "@/components/distributor/ShopFragrancesSection";
import ShoppingBenefitsSection from "@/components/distributor/ShoppingBenefitsSection";
import { structuredDataJson } from "@/lib/commerce/seo";
import { pageMetadata } from "@/lib/metadata";
import { officialDistributorStructuredData } from "@/lib/official-distributor";

export const metadata: Metadata = pageMetadata({
  path: "/official-uk-distributor",
  title: "N7 Cosmetics | Verified UK Yusuf Bhai Distributor",
  description:
    "Verify N7 Cosmetics, a UK-registered company and authorised Yusuf Bhai perfume distributor. Check our official supplier listing and company registration.",
  robots: { index: true, follow: true },
});

export default function OfficialUkDistributorPage() {
  return (
    <div className="bg-primary-50 text-dark-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: structuredDataJson(officialDistributorStructuredData),
        }}
      />
      <DistributorHero />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-4xl space-y-12 wrap-anywhere sm:space-y-16 lg:space-y-20">
          <BusinessOverviewSection />
          <DistributorStatusSection />
          <CompanyRegistrationSection />
          <BrandIdentitySection />
          <AuthenticitySection />
          <ShoppingBenefitsSection />
          <DistributorFaqSection />
          <ShopFragrancesSection />
        </div>
      </div>
    </div>
  );
}
