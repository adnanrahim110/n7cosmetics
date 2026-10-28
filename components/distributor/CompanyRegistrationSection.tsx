import { officialDistributor } from "@/lib/official-distributor";
import DistributorLink from "./DistributorLink";
import DistributorSection from "./DistributorSection";

const registrationDetails = [
  { label: "Registered Business Name", value: officialDistributor.legalName },
  {
    label: "Company Registration Number",
    value: officialDistributor.companyNumber,
  },
  { label: "Country of Registration", value: "England, United Kingdom" },
  { label: "Incorporation Date", value: "13 April 2024" },
  {
    label: "Registered Office",
    value: Object.values(officialDistributor.address).join(", "),
  },
  { label: "Official Website", value: officialDistributor.website },
];

export default function CompanyRegistrationSection() {
  return (
    <DistributorSection
      id="company-registration"
      title="UK Company Registration & Business Verification"
    >
      <p>
        N7 Cosmetics operates under the registered legal entity{" "}
        {officialDistributor.legalName}.
      </p>
      <dl className="divide-y divide-primary-200 border-y border-primary-200">
        {registrationDetails.map(({ label, value }) => (
          <div
            className="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-8"
            key={label}
          >
            <dt className="font-medium text-primary-950">{label}</dt>
            <dd className="min-w-0 wrap-anywhere">{value}</dd>
          </div>
        ))}
      </dl>
      <p>
        Our company registration is publicly accessible through the official UK
        government Companies House register.
      </p>
      <DistributorLink href={officialDistributor.companyUrl}>
        Verify N7 Cosmetics Limited on GOV.UK
      </DistributorLink>
      <p className="text-sm italic">
        The address above is our registered office, not an advertised walk-in
        retail shop.
      </p>
    </DistributorSection>
  );
}
