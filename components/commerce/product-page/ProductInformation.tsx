import ProductReviews from "@/components/commerce/ProductReviews";
import Tabs from "@/components/ui/Tabs";
import type { StorefrontProduct } from "@/lib/commerce/catalog";
import type { ProductReviewSummary } from "@/lib/commerce/reviews";

const audienceLabels: Record<string, string> = {
  MEN: "Men",
  WOMEN: "Women",
  UNISEX: "Unisex",
};

export default function ProductInformation({
  product,
  reviews,
}: {
  product: StorefrontProduct;
  reviews: ProductReviewSummary;
}) {
  const description =
    product.description?.trim() || product.shortDescription?.trim();
  const facts = [
    ["Size / option", product.variantTitle?.trim()],
    ["Brand", product.brand?.trim()],
    ["Audience", audienceLabels[product.audience]],
    ["Collection", product.collectionName?.trim()],
    ["Inspired by", product.inspiredBy?.trim()],
    ["Product code", product.productCode?.trim()],
    ["Pack weight", product.weightGrams ? `${product.weightGrams} g` : null],
  ].filter(([, value]) => value);
  return (
    <section
      aria-label="More about this product"
      className="mx-auto mt-12 max-w-7xl px-4 sm:px-8 lg:mt-10"
    >
      <Tabs
        label="Product information"
        items={[
          {
            id: "about-the-fragrance",
            label: "About the fragrance",
            content: (
              <div>
                <h2 className="font-heading text-2xl text-[#1c1814] sm:text-3xl">
                  About the fragrance
                </h2>
                <p className="mt-4 whitespace-pre-line text-sm leading-7 text-stone-700 wrap-anywhere sm:text-base">
                  {description ||
                    "No additional fragrance description is available yet."}
                </p>
              </div>
            ),
          },
          {
            id: "product-details",
            label: "Product details",
            content: (
              <div>
                <h2 className="font-heading text-2xl text-[#1c1814] sm:text-3xl">
                  Product details
                </h2>
                <dl className="mt-5 grid gap-x-12 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                  {facts.map(([label, value]) => (
                    <div className="min-w-0" key={label}>
                      <dt className="text-xs font-medium text-stone-600">
                        {label}
                      </dt>
                      <dd className="mt-1 text-sm text-stone-900 wrap-anywhere">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ),
          },
          {
            id: "reviews",
            label: `Reviews (${reviews.totalReviews})`,
            content: (
              <ProductReviews
                productId={product.id}
                productName={product.name}
                productSlug={product.slug}
                summary={reviews}
                embedded
              />
            ),
          },
        ]}
      />
    </section>
  );
}
