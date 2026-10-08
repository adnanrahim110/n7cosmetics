import { useId } from "react";
import ProductInformationAccordion from "./ProductInformationAccordion";
import ProductReturnsSummary from "./ProductReturnsSummary";

type AccordionSection = {
  heading?: string;
  paragraphs: readonly string[];
};

type ProductAccordion = {
  title: string;
  sections: readonly AccordionSection[];
};

const accordions: readonly ProductAccordion[] = [
  {
    title: "Disclaimer",
    sections: [
      {
        paragraphs: [
          "At N7 Cosmetics, we are committed to providing authentic, high-quality fragrances inspired by the artistry of renowned perfumers and luxury scent traditions. Fragrance performance, longevity, and scent perception may vary based on skin chemistry, environment, and individual preferences.",
          "Product images, descriptions, and notes are provided for informational purposes and may vary slightly from the final product. N7 Cosmetics does not claim affiliation with any designer brands referenced for inspiration purposes. All trademarks and brand names belong to their respective owners.",
          "By purchasing from our website, customers acknowledge that fragrance preferences are subjective and that product suitability may differ from person to person.",
        ],
      },
    ],
  },
  {
    title: "Shipping & returns",
    sections: [
      {
        heading: "Fast & Reliable UK Delivery",
        paragraphs: [
          "At N7 Cosmetics, we strive to dispatch all orders quickly and securely to ensure your fragrances arrive in perfect condition. Orders are typically processed within 1–2 business days, with delivery times varying depending on location and courier services.",
        ],
      },
    ],
  },
  {
    title: "How to use",
    sections: [
      {
        heading: "Get the Best Performance from Your Fragrance",
        paragraphs: [
          "For long-lasting results, spray your fragrance on clean, moisturized skin. Apply to pulse points such as the wrists, neck, behind the ears, and inner elbows where body heat naturally enhances scent projection.",
          "Avoid rubbing the fragrance after application, as this can alter the fragrance structure and reduce its longevity. For a stronger scent experience, lightly spray on clothing from a safe distance and store your fragrance in a cool, dry place away from direct sunlight.",
          "Whether you're dressing for a special occasion, work, or everyday wear, N7 Cosmetics fragrances are crafted to leave a memorable impression and become part of your unique identity.",
        ],
      },
    ],
  },
];

export default function ProductAccordions() {
  const accordionGroup = useId();

  return (
    <div className="mt-7 divide-y divide-black/12 border-y border-black/12">
      {accordions.map(({ title, sections }) => (
        <ProductInformationAccordion
          key={title}
          title={title}
          name={accordionGroup}
        >
          <div className="space-y-4 pb-5 text-xs leading-5 text-stone-600">
            {sections.map(({ heading, paragraphs }) => (
              <div key={heading ?? title}>
                {heading && (
                  <h3 className="mb-2 font-body text-xs font-semibold tracking-normal text-stone-900">
                    {heading}
                  </h3>
                )}
                <div className="space-y-3">
                  {paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </div>
            ))}
            {title === "Shipping & returns" ? <ProductReturnsSummary /> : null}
          </div>
        </ProductInformationAccordion>
      ))}
    </div>
  );
}
