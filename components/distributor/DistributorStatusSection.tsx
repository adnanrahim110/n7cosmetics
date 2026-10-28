import { officialDistributor } from "@/lib/official-distributor";
import DistributorLink from "./DistributorLink";
import DistributorSection from "./DistributorSection";

export default function DistributorStatusSection() {
  return (
    <DistributorSection
      id="official-distributor-status"
      title="Our Official Distributor Status"
    >
      <p>
        N7 Cosmetics is recognised as an authorised UK distributor of Yusuf Bhai
        Fragrances.
      </p>
      <p>
        Customers can independently verify our distributor status directly
        through Yusuf Bhai’s official website.
      </p>
      <div className="border-l-2 border-primary-700 bg-primary-100 p-4 sm:p-6">
        <p className="font-semibold text-primary-950">
          Official Distributor Verification
        </p>
        <DistributorLink href={officialDistributor.supplierUrl}>
          View N7 Cosmetics on Yusuf Bhai’s official distributors page
        </DistributorLink>
      </div>
      <p>
        On the official distributor page, N7 Cosmetics is listed under London,
        United Kingdom.
      </p>
    </DistributorSection>
  );
}
