import ProductDetailActions from "@/components/commerce/ProductDetailActions";
import ProductStockStatus from "@/components/commerce/ProductStockStatus";
import RatingStars from "@/components/commerce/RatingStars";
import ProductCodeBar from "@/components/ui/ProductCodeBar";
import Title from "@/components/ui/Title";
import type { StorefrontProduct } from "@/lib/commerce/catalog";
import type { PublicShippingMethod } from "@/lib/commerce/legal";
import type { ProductReviewSummary } from "@/lib/commerce/reviews";
import type { PublicSiteSettings } from "@/lib/commerce/settings";
import { CircleDivide, User } from "lucide-react";
import ProductAccordions from "./ProductAccordions";
import ProductDelivery from "./ProductDelivery";

const audienceLabels: Record<string, string> = {
  MEN: "Men",
  WOMEN: "Women",
  UNISEX: "Unisex",
};

function money(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

export default function ProductSummary({
  product,
  reviews,
  settings,
  shippingMethods,
  paymentEnabled,
}: {
  product: StorefrontProduct;
  reviews: ProductReviewSummary;
  settings: PublicSiteSettings;
  shippingMethods: PublicShippingMethod[];
  paymentEnabled: boolean;
}) {
  const eyebrow = [product.brand?.trim()].filter(Boolean).join(" · ");
  const inspiredBy = product.inspiredBy?.trim();
  const shortDescription =
    product.shortDescription?.trim() || product.description?.trim();
  const compareAt = product.compareAtPricePence;
  const onSale = compareAt !== null && compareAt > product.pricePence;
  const saving = onSale
    ? Math.round((1 - product.pricePence / compareAt) * 100)
    : 0;
  const commerceProduct = {
    slug: product.slug,
    name: product.name,
    productCode: product.productCode,
    inspiredBy: product.inspiredBy,
    image: product.image,
    pricePence: product.pricePence,
  };

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-end justify-between gap-3">
        {eyebrow ? (
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#8d6745]">
            {eyebrow}
          </p>
        ) : null}
      </div>
      <Title
        as="h1"
        className="mt-1 wrap-anywhere"
        id="product-title"
        text={product.name}
        tone="ink"
      />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {inspiredBy ? (
          <span className="inline-flex max-w-full items-center border border-[#967C55]/24 bg-[#967C55]/8 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-primary-700 wrap-anywhere">
            Inspired by&nbsp;<span className="text-primary-800 font-bold">{inspiredBy}</span>
          </span>
        ) : (
          <span className="inline-flex font-body max-w-full items-center border border-primary-400/40 bg-primary-400/40 px-2 py-1.5 text-xs tracking-wide text-primary-900 wrap-anywhere">
            <User className="mr-0.5" size={13} strokeWidth={2} />
            <strong className="mr-1">Orientation:</strong>{" "}
            {audienceLabels[product.audience]}
          </span>
        )}
        <ProductCodeBar
          code={product.productCode}
          compact
          className="text-[9px]!"
        />

        <div className="flex flex-col items-start text-[11px] text-black">
          <div className="inline-flex items-center gap-1">
            <RatingStars rating={reviews.averageRating} size={13} />
            <span className="font-semibold text-xs">
              {reviews.totalReviews
                ? `${
                    Number.isInteger(reviews.averageRating)
                      ? reviews.averageRating
                      : reviews.averageRating.toFixed(1)
                  }/5`
                : "No reviews yet"}
            </span>
          </div>
          <a
            href="#reviews"
            className="relative text-stone-600 underline transition-colors after:absolute after:inset-x-0 after:-inset-y-4 hover:text-black focus-visible:ring-2 focus-visible:ring-stone-700 motion-reduce:transition-none"
          >
            {reviews.totalReviews}{" "}
            {reviews.totalReviews === 1 ? "review" : "reviews"}
          </a>
        </div>
      </div>
      {inspiredBy ? (
        <div className="mt-1 flex flex-wrap gap-2">
          <span className="inline-flex font-body max-w-full items-center border border-black/50 bg-white px-2 py-1.5 text-xs tracking-wide text-black wrap-anywhere">
            <CircleDivide
              className="rotate-45 mr-0.5"
              size={13}
              strokeWidth={2}
            />
            <strong className="mr-1">Concentration:</strong> Extrait De Parfum
          </span>
          <span className="inline-flex font-body max-w-full items-center border border-primary-400/40 bg-primary-400/40 px-2 py-1.5 text-xs tracking-wide text-primary-900 wrap-anywhere">
            <User className="mr-0.5" size={13} strokeWidth={2} />
            <strong className="mr-1">Orientation:</strong>{" "}
            {audienceLabels[product.audience]}
          </span>
        </div>
      ) : null}
      {shortDescription ? (
        <p className="mt-6 max-w-xl whitespace-pre-line text-base font-light leading-7 text-black/62 wrap-anywhere">
          {shortDescription}
        </p>
      ) : null}
      <div className="mt-6 border-y border-stone-900/10 py-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <span className="font-heading text-4xl font-semibold tracking-tight text-stone-950">
            {money(product.pricePence)}
          </span>
          {onSale ? (
            <>
              <span className="text-base text-stone-600 line-through">
                <span className="sr-only">Original price </span>
                {money(compareAt)}
              </span>
              {saving > 0 ? (
                <span className="rounded-sm bg-[#78552f] px-2 py-1 text-xs font-semibold text-white">
                  Save {saving}%
                </span>
              ) : null}
            </>
          ) : null}
          <ProductStockStatus
            slug={product.slug}
            soldOutOnly
            className="text-xs tracking-normal normal-case"
          />
        </div>
        {product.variantTitle?.trim() ? (
          <p className="mt-3 text-sm text-stone-700">
            <span className="text-stone-600">Size / option</span>
            <span className="ml-3 font-semibold text-stone-900">
              {product.variantTitle}
            </span>
          </p>
        ) : null}
      </div>
      <ProductDetailActions
        product={commerceProduct}
        paymentEnabled={paymentEnabled}
      />
      <ProductDelivery
        settings={settings}
        shippingMethods={shippingMethods}
        paymentEnabled={paymentEnabled}
      />
      <ProductAccordions />
    </div>
  );
}
