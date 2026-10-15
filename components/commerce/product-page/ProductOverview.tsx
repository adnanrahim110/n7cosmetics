import ProductGallery from "@/components/commerce/ProductGallery";
import type { StorefrontProduct } from "@/lib/commerce/catalog";
import type { PublicShippingMethod } from "@/lib/commerce/legal";
import type { ProductReviewSummary } from "@/lib/commerce/reviews";
import type { PublicSiteSettings } from "@/lib/commerce/settings";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import ProductSummary from "./ProductSummary";

interface ProductOverviewProps {
  product: StorefrontProduct;
  reviews: ProductReviewSummary;
  settings: PublicSiteSettings;
  shippingMethods: PublicShippingMethod[];
  paymentEnabled: boolean;
}

export default function ProductOverview({
  product,
  reviews,
  settings,
  shippingMethods,
  paymentEnabled,
}: ProductOverviewProps) {
  const gallery = [
    ...product.images.map((image) => ({
      url: image.url,
      type: "image" as const,
      alt: image.alt,
    })),
    ...product.videos.map((video) => ({
      url: video.url,
      type: "video" as const,
      alt: video.title,
    })),
  ];

  return (
    <section
      aria-labelledby="product-title"
      className="mx-auto max-w-7xl px-4 sm:px-8"
    >
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-x-2 text-xs text-stone-600"
      >
        <Link
          className="inline-flex min-h-11 items-center underline-offset-4 hover:text-stone-950 hover:underline focus-visible:ring-2 focus-visible:ring-stone-700"
          href="/"
        >
          Home
        </Link>
        {product.collectionSlug && product.collectionName ? (
          <>
            <ChevronRight aria-hidden="true" size={12} />
            <Link
              className="inline-flex min-h-11 items-center underline-offset-4 hover:text-stone-950 hover:underline focus-visible:ring-2 focus-visible:ring-stone-700"
              href={`/${product.collectionSlug}`}
            >
              {product.collectionName}
            </Link>
          </>
        ) : null}
        <ChevronRight aria-hidden="true" size={12} />
        <span
          aria-current="page"
          className="min-w-0 text-stone-900 wrap-anywhere"
        >
          {product.name}
        </span>
      </nav>
      <div className="mt-4 grid items-start gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12 xl:gap-16">
        <ProductGallery items={gallery} productName={product.name} />
        <ProductSummary
          product={product}
          reviews={reviews}
          settings={settings}
          shippingMethods={shippingMethods}
          paymentEnabled={paymentEnabled}
        />
      </div>
    </section>
  );
}
