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
import { pageMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const product = await getStorefrontProduct((await params).slug);
  if (!product) notFound();
  const description =
    product.seoDescription ??
    product.shortDescription ??
    product.description ??
    `Explore ${product.name}, available from N7 Cosmetics in the UK.`;
  const image = product.images[0];
  return pageMetadata({
    title: product.seoTitle ?? `${product.name} | N7 Cosmetics`,
    description,
    path: `/products/${product.slug}`,
    image,
  });
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
