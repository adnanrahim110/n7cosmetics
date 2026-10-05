import ProductInformation from "@/components/commerce/product-page/ProductInformation";
import ProductOverview from "@/components/commerce/product-page/ProductOverview";
import ProductScentOverview from "@/components/commerce/product-page/ProductScentOverview";
import RelatedProductsSlider from "@/components/commerce/RelatedProductsSlider";
import {
  getRelatedStorefrontProducts,
  getStorefrontProduct,
} from "@/lib/commerce/catalog";
import { getPublicShippingMethods } from "@/lib/commerce/legal";
import { getProductReviewSummary } from "@/lib/commerce/reviews";
import { productStructuredData, structuredDataJson } from "@/lib/commerce/seo";
import { getPublicSiteSettings } from "@/lib/commerce/settings";
import { getPublicPaymentAvailability } from "@/lib/payments/settings";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

function absoluteUrl(path: string): string {
  const fallback = "https://n7cosmetics.co.uk";
  try {
    return new URL(path, process.env.APP_URL || fallback).toString();
  } catch {
    return new URL(path, fallback).toString();
  }
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const product = await getStorefrontProduct((await params).slug);
  if (!product) return {};
  const description =
    product.seoDescription ??
    product.shortDescription ??
    product.description ??
    undefined;
  const image = product.images[0] ? absoluteUrl(product.images[0].url) : null;
  return {
    title: product.seoTitle ?? `${product.name} | N7 Cosmetics`,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.seoTitle ?? product.name,
      description,
      type: "website",
      images: image ? [{ url: image, alt: product.images[0].alt }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: product.seoTitle ?? product.name,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getStorefrontProduct((await params).slug);
  if (!product) notFound();
  const [reviews, relatedProducts, settings, shippingMethods, paymentEnabled] =
    await Promise.all([
      getProductReviewSummary(product.id),
      getRelatedStorefrontProducts(product.id, product.audience),
      getPublicSiteSettings(),
      getPublicShippingMethods("GB"),
      getPublicPaymentAvailability(),
    ]);

  return (
    <div className="min-h-screen bg-[#f3eee5] pb-16 pt-32 text-[#1c1814] sm:pt-44">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: structuredDataJson(productStructuredData(product, reviews)),
        }}
      />
      <ProductOverview
        product={product}
        reviews={reviews}
        settings={settings}
        shippingMethods={shippingMethods}
        paymentEnabled={paymentEnabled}
      />
      <ProductScentOverview product={product} />
      <ProductInformation product={product} reviews={reviews} />
      <RelatedProductsSlider products={relatedProducts} />
    </div>
  );
}
