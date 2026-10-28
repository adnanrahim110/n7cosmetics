import DistributorBenefitCard, {
  type DistributorBenefit,
} from "./DistributorBenefitCard";
import DistributorSection from "./DistributorSection";

const benefits: DistributorBenefit[] = [
  {
    title: "Official Distributor Recognition",
    description:
      "Our distributor status can be independently checked on Yusuf Bhai’s official website.",
  },
  {
    title: "UK-Registered Business",
    description:
      "Our company information is publicly available through Companies House.",
  },
  {
    title: "Dedicated UK Online Store",
    description:
      "Customers can browse Yusuf Bhai fragrances and order directly from our official website.",
  },
  {
    title: "Secure Online Payments",
    description: "Checkout is processed using secure card payment facilities.",
  },
  {
    title: "UK Delivery",
    description:
      "We offer delivery throughout the United Kingdom, with free shipping on qualifying orders above £99.",
  },
  {
    title: "Customer Support",
    description:
      "Customers can contact our team through our official website for order enquiries, product assistance and delivery support.",
  },
];

export default function ShoppingBenefitsSection() {
  return (
    <DistributorSection id="why-shop-with-us" title="Why Shop With N7 Cosmetics?">
      <ul className="grid gap-4 md:grid-cols-2 xl:gap-6">
        {benefits.map((benefit) => (
          <DistributorBenefitCard key={benefit.title} {...benefit} />
        ))}
      </ul>
    </DistributorSection>
  );
}
