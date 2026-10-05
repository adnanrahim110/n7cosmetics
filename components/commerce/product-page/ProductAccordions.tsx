import ProductInformationAccordion from "./ProductInformationAccordion";

const accordions = [
  {
    title: "Disclaimer",
    content:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
  {
    title: "Shipping & returns",
    content:
      "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  },
  {
    title: "How to use",
    content:
      "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
  },
];

export default function ProductAccordions() {
  return (
    <div className="mt-7 divide-y divide-black/12 border-y border-black/12">
      {accordions.map(({ title, content }, index) => (
        <ProductInformationAccordion key={title} title={title}>
          <p className="pb-5 text-sm font-light leading-7 text-stone-600">
            {content}
          </p>
        </ProductInformationAccordion>
      ))}
    </div>
  );
}
