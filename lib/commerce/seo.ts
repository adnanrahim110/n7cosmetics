import { globalContent } from "../../content/global";
import { productBreadcrumbs } from "./breadcrumbs";
import type { StorefrontProduct } from "./catalog";
import type { StorefrontBundle } from "./bundles";
import type { PublicShippingMethod } from "./legal";
import type { ProductReviewSummary } from "./reviews";
import type { PublicSiteSettings } from "./settings";
import { stockAvailability } from "./stock";

export interface StoreSchemaInput {
  settings: PublicSiteSettings;
  shippingMethods: readonly PublicShippingMethod[];
}

interface ShippingConditionSchema {
  "@type": "ShippingConditions";
  shippingDestination: { "@type": "DefinedRegion"; addressCountry: string };
  orderValue: {
    "@type": "MonetaryAmount";
    minValue: number;
    maxValue?: number;
    currency: string;
  };
  shippingRate: { "@type": "MonetaryAmount"; value: number; currency: string };
}

interface ShippingServiceSchema {
  "@type": "ShippingService";
  "@id": string;
  name: string;
  description: string;
  fulfillmentType: "https://schema.org/FulfillmentTypeDelivery";
  shippingConditions: ShippingConditionSchema[];
}

export function storefrontUrl(path: string): string {
  const fallback = "https://n7cosmetics.co.uk";
  try {
    return new URL(path, process.env.APP_URL || fallback).toString();
  } catch {
    return new URL(path, fallback).toString();
  }
}

export function merchantReturnPolicySchema() {
  return {
    "@type": "MerchantReturnPolicy" as const,
    "@id": storefrontUrl("/shipping-returns#return-policy"),
    applicableCountry: "GB",
    merchantReturnLink: storefrontUrl("/shipping-returns"),
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: 30,
    description:
      "Return sealed, unused items within 30 days of delivery. Opened or used fragrances can only be returned if faulty. Customers pay change-of-mind return postage; N7 covers faulty-item return postage.",
    itemCondition: "https://schema.org/NewCondition",
    returnMethod: "https://schema.org/ReturnByMail",
    returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
    customerRemorseReturnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
    itemDefectReturnFees: "https://schema.org/FreeReturn",
  };
}

export function shippingServiceSchema(
  methods: readonly PublicShippingMethod[],
  currency = "GBP",
): ShippingServiceSchema[] {
  const money = (pence: number) =>
    new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(pence / 100);

  return methods.flatMap((method): ShippingServiceSchema[] => {
    if (
      method.methodType !== "DELIVERY" || !method.isCountrywide ||
      !Number.isSafeInteger(method.pricePence) || method.pricePence < 0
    ) return [];

    const rules = method.freeShippingRules;
    if (rules.some((rule) =>
      !Number.isSafeInteger(rule.minimumSubtotalPence) || rule.minimumSubtotalPence < 0,
    )) return [];
    // Mixed before/after-discount conditions cannot be expressed by one order-value range.
    if (method.pricePence > 0 && new Set(rules.map((rule) => rule.thresholdBasis)).size > 1) return [];
    const rule = rules.toSorted((a, b) => a.minimumSubtotalPence - b.minimumSubtotalPence)[0];
    const freeFrom = method.pricePence === 0 ? 0 : rule?.minimumSubtotalPence;
    const destination = { "@type": "DefinedRegion" as const, addressCountry: method.countryCode };
    const conditions: ShippingConditionSchema[] = [];

    if (freeFrom !== 0) {
      conditions.push({
        "@type": "ShippingConditions",
        shippingDestination: destination,
        orderValue: {
          "@type": "MonetaryAmount", minValue: 0, currency,
          ...(freeFrom !== undefined ? { maxValue: (freeFrom - 1) / 100 } : {}),
        },
        shippingRate: { "@type": "MonetaryAmount", value: method.pricePence / 100, currency },
      });
    }
    if (freeFrom !== undefined) {
      conditions.push({
        "@type": "ShippingConditions",
        shippingDestination: destination,
        orderValue: { "@type": "MonetaryAmount", minValue: freeFrom / 100, currency },
        shippingRate: { "@type": "MonetaryAmount", value: 0, currency },
      });
    }

    const description = freeFrom === 0
      ? `Delivery to ${method.countryCode} is free.`
      : `Delivery to ${method.countryCode} costs ${money(method.pricePence)}.${rule ? ` Free shipping on orders of ${money(rule.minimumSubtotalPence)} or more ${rule.thresholdBasis === "BEFORE_DISCOUNT" ? "before" : "after"} discounts.` : ""}`;
    return [{
      "@type": "ShippingService",
      "@id": storefrontUrl(`/shipping-returns#shipping-${method.id}`),
      name: method.name,
      description,
      fulfillmentType: "https://schema.org/FulfillmentTypeDelivery",
      shippingConditions: conditions,
    }];
  });
}

export function onlineStoreSchema({ settings, shippingMethods }: StoreSchemaInput) {
  const services = shippingServiceSchema(shippingMethods, settings.currency || "GBP");
  const email = settings.email?.trim();
  const telephone = settings.phone?.trim();
  const sameAs = settings.socialLinks.map((link) => link.url);
  return {
    "@type": "OnlineStore" as const,
    "@id": storefrontUrl("/#organization"),
    name: globalContent.header.name,
    url: storefrontUrl("/"),
    logo: storefrontUrl(globalContent.header.logo),
    ...(email ? { email } : {}),
    ...(telephone ? { telephone } : {}),
    ...(email || telephone ? {
      contactPoint: {
        "@type": "ContactPoint" as const,
        contactType: "Customer Service",
        ...(email ? { email } : {}),
        ...(telephone ? { telephone } : {}),
      },
    } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    hasMerchantReturnPolicy: merchantReturnPolicySchema(),
    ...(services.length ? { hasShippingService: services } : {}),
  };
}

export function productRatingsSchema(reviews: ProductReviewSummary) {
  const validReviews = reviews.reviews.filter((review) =>
    Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5 &&
    review.reviewerName.trim() && review.body.trim(),
  );
  return {
    ...(reviews.totalReviews > 0 && reviews.totalReviews === validReviews.length &&
      Number.isFinite(reviews.averageRating) && reviews.averageRating >= 1 && reviews.averageRating <= 5 ? {
        aggregateRating: {
          "@type": "AggregateRating" as const,
          ratingValue: Number(reviews.averageRating.toFixed(2)),
          reviewCount: reviews.totalReviews,
          bestRating: 5,
          worstRating: 1,
        },
      } : {}),
    ...(validReviews.length ? {
      review: validReviews.map((review) => ({
        "@type": "Review" as const,
        author: { "@type": "Person" as const, name: review.reviewerName },
        reviewRating: {
          "@type": "Rating" as const, ratingValue: review.rating, bestRating: 5, worstRating: 1,
        },
        ...(review.title?.trim() ? { name: review.title } : {}),
        reviewBody: review.body,
        ...(Number.isFinite(review.publishedAt.getTime()) ? {
          datePublished: review.publishedAt.toISOString().slice(0, 10),
        } : {}),
      })),
    } : {}),
  };
}

export function productStructuredData(
  product: StorefrontProduct | StorefrontBundle,
  reviews: ProductReviewSummary,
) {
  const bundle = "components" in product ? product : undefined;
  const available = stockAvailability({
    ...product,
    components: bundle?.componentsAvailable
      ? bundle.components.map((component) => ({ ...component, available: true })) : [],
  });
  const url = storefrontUrl(`/${product.productType === "BUNDLE" ? "bundles" : "products"}/${product.slug}`);
  return {
    "@type": "Product" as const,
    "@id": `${url}#product`,
    name: product.name,
    description: product.shortDescription || product.description || undefined,
    image: product.images.map((image) => storefrontUrl(image.url)),
    url,
    ...(product.sku.trim() ? { sku: product.sku } : {}),
    ...(product.brand?.trim() ? { brand: { "@type": "Brand" as const, name: product.brand } } : {}),
    category: product.productType === "BUNDLE" ? "Perfume bundle" : "Perfume",
    ...(product.variantTitle.trim() ? { size: product.variantTitle } : {}),
    offers: {
      "@type": "Offer" as const,
      url,
      price: (product.pricePence / 100).toFixed(2),
      priceCurrency: "GBP",
      availability: `https://schema.org/${available.soldOut ? "OutOfStock" : "InStock"}`,
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": storefrontUrl("/#organization") },
    },
    ...productRatingsSchema(reviews),
  };
}

export function breadcrumbSchema(product: StorefrontProduct) {
  const items = productBreadcrumbs(product);
  return {
    "@type": "BreadcrumbList" as const,
    "@id": `${storefrontUrl(items[items.length - 1].href)}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem" as const,
      position: index + 1,
      name: item.name,
      item: storefrontUrl(item.href),
    })),
  };
}

export function makeStorePageSchema(store: StoreSchemaInput) {
  return { "@context": "https://schema.org", "@graph": [onlineStoreSchema(store)] };
}

export function makeProductPageSchema(
  product: StorefrontProduct | StorefrontBundle,
  reviews: ProductReviewSummary,
  store: StoreSchemaInput,
) {
  return {
    "@context": "https://schema.org",
    "@graph": [onlineStoreSchema(store), productStructuredData(product, reviews), breadcrumbSchema(product)],
  };
}

// Product text is editable in admin; it must never terminate the JSON-LD script.
export function structuredDataJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
