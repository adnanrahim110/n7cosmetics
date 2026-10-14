import assert from "node:assert/strict";
import test from "node:test";
import type { StorefrontProduct } from "../lib/commerce/catalog";
import type { StorefrontBundle } from "../lib/commerce/bundles";
import { productBreadcrumbs } from "../lib/commerce/breadcrumbs";
import type { PublicShippingMethod } from "../lib/commerce/legal";
import type { ProductReviewSummary } from "../lib/commerce/reviews";
import {
  breadcrumbSchema,
  makeProductPageSchema,
  makeStorePageSchema,
  merchantReturnPolicySchema,
  onlineStoreSchema,
  productRatingsSchema,
  productStructuredData,
  shippingServiceSchema,
  storefrontUrl,
  structuredDataJson,
  type StoreSchemaInput,
} from "../lib/commerce/seo";

const product: StorefrontProduct = {
  id: "42", productType: "STANDARD", variantId: "101", variantTitle: "100ml",
  sku: "YB-101-100", slug: "example-perfume", name: "Example Perfume", brand: "Yusuf Bhai",
  shortDescription: "A fresh fragrance.", description: "Fresh citrus and warm woods.",
  inspiredBy: "Designer inspiration", productCode: "101", audience: "UNISEX", notes: [],
  noteGroups: { top: [], heart: [], base: [] },
  scentProfile: { families: [], moods: [], occasions: [], seasons: [], intensity: null, projection: null, longevity: "", evidence: "" },
  seoTitle: null, seoDescription: null, pricePence: 3701, compareAtPricePence: 4500,
  stockOnHand: 4, trackInventory: true, weightGrams: null,
  image: "/media/example.webp", imageAlt: "Example perfume", video: null,
  images: [{ url: "/media/example.webp", alt: "Example perfume" }], videos: [],
  collectionName: "Recreations", collectionSlug: "recreations",
};
const noReviews: ProductReviewSummary = { totalReviews: 0, averageRating: 0, distribution: [], reviews: [] };
const reviews: ProductReviewSummary = {
  totalReviews: 2, averageRating: 4.5, distribution: [{ rating: 5, count: 1 }, { rating: 4, count: 1 }],
  reviews: [
    { id: "1", reviewerName: "Customer One", rating: 5, title: null, body: "Fresh and long lasting.",
      recommendsProduct: true, verifiedPurchase: false, publishedAt: new Date("2026-07-06T12:00:00Z"), media: [] },
    { id: "2", reviewerName: "Customer Two", rating: 4, title: "Lovely fragrance", body: "Warm and smooth.",
      recommendsProduct: true, verifiedPurchase: true, publishedAt: new Date("2026-07-15T12:00:00Z"), media: [] },
  ],
};
const standard: PublicShippingMethod = {
  id: "1-1", name: "UK Standard Delivery", methodType: "DELIVERY", countryCode: "GB", isCountrywide: true,
  zoneName: "United Kingdom", postcodes: [], pricePence: 299,
  freeShippingRules: [{ id: "1", name: "Free standard delivery", minimumSubtotalPence: 9900, thresholdBasis: "BEFORE_DISCOUNT" }],
  estimatedDaysMin: 3, estimatedDaysMax: 5,
};
const store: StoreSchemaInput = {
  settings: { currency: "GBP", email: "info@n7cosmetics.co.uk", phone: "+441234567890",
    socialLinks: [{ platform: "instagram", url: "https://www.instagram.com/n7cosmetics/" }] },
  shippingMethods: [standard],
};

test("one product graph contains all six schema groups with one connected store identity", () => {
  const data = makeProductPageSchema(product, reviews, store);
  assert.equal(data["@context"], "https://schema.org");
  assert.deepEqual(data["@graph"].map((node) => node["@type"]), ["OnlineStore", "Product", "BreadcrumbList"]);
  const productNode = data["@graph"].find((node) => node["@type"] === "Product");
  const storeNode = data["@graph"].find((node) => node["@type"] === "OnlineStore");
  assert.ok(productNode && storeNode);
  assert.equal(productNode.offers.seller["@id"], storeNode["@id"]);
  assert.equal(productNode.aggregateRating?.reviewCount, 2);
  assert.equal(productNode.review?.length, 2);
  assert.equal(storeNode.hasMerchantReturnPolicy["@type"], "MerchantReturnPolicy");
  assert.equal(storeNode.hasShippingService?.[0]["@type"], "ShippingService");
  assert.equal("shippingDetails" in productNode.offers, false);
});

test("homepage and policy-page markup describe only the store and its existing contact details", () => {
  const data = makeStorePageSchema(store);
  assert.equal(data["@graph"].length, 1);
  const node = data["@graph"][0];
  assert.equal(node["@type"], "OnlineStore");
  assert.equal(node["@id"], storefrontUrl("/#organization"));
  assert.equal(node.logo, storefrontUrl("/imgs/logo-w.png"));
  assert.equal(node.contactPoint?.email, store.settings.email);
  assert.deepEqual(node.sameAs, store.settings.socialLinks.map((link) => link.url));
  const empty = onlineStoreSchema({ settings: { socialLinks: [] }, shippingMethods: [] });
  assert.equal("hasShippingService" in empty, false);
  assert.equal("contactPoint" in empty, false);
  assert.equal("sameAs" in empty, false);
});

test("return policy uses the finite 30-day window and preserves the two postage responsibilities", () => {
  const policy = merchantReturnPolicySchema();
  assert.equal(policy.returnPolicyCategory, "https://schema.org/MerchantReturnFiniteReturnWindow");
  assert.equal(policy.merchantReturnDays, 30);
  assert.equal(policy.applicableCountry, "GB");
  assert.equal(policy.merchantReturnLink, storefrontUrl("/shipping-returns"));
  assert.equal(policy.itemCondition, "https://schema.org/NewCondition");
  assert.equal(policy.returnMethod, "https://schema.org/ReturnByMail");
  assert.equal(policy.customerRemorseReturnFees, "https://schema.org/ReturnFeesCustomerResponsibility");
  assert.equal(policy.itemDefectReturnFees, "https://schema.org/FreeReturn");
  assert.match(policy.description, /sealed, unused/);
});

test("shipping conditions charge £2.99 through £98.99 and become free at exactly £99", () => {
  const services = shippingServiceSchema([standard]);
  assert.equal(services.length, 1);
  assert.match(services[0].description, /before discounts/);
  const [paid, free] = services[0].shippingConditions;
  assert.deepEqual(paid.orderValue, { "@type": "MonetaryAmount", minValue: 0, maxValue: 98.99, currency: "GBP" });
  assert.equal(paid.shippingRate.value, 2.99);
  assert.deepEqual(free.orderValue, { "@type": "MonetaryAmount", minValue: 99, currency: "GBP" });
  assert.equal(free.shippingRate.value, 0);
  assert.equal(paid.shippingDestination.addressCountry, "GB");
  assert.equal("transitTime" in paid, false);
  assert.equal("handlingTime" in services[0], false);
});

test("shipping schema follows changed admin rates, thresholds, and discount basis", () => {
  const method = { ...standard, pricePence: 450, freeShippingRules: [
    { ...standard.freeShippingRules[0], minimumSubtotalPence: 7500, thresholdBasis: "AFTER_DISCOUNT" as const },
  ] };
  const service = shippingServiceSchema([method])[0];
  assert.match(service.description, /£4\.50/);
  assert.match(service.description, /after discounts/);
  assert.equal(service.shippingConditions[0].orderValue.maxValue, 74.99);
  assert.equal(service.shippingConditions[1].orderValue.minValue, 75);
});

test("free services and zero thresholds have one condition with no negative order range", () => {
  for (const method of [
    { ...standard, pricePence: 0 },
    { ...standard, freeShippingRules: [{ ...standard.freeShippingRules[0], minimumSubtotalPence: 0 }] },
  ]) {
    const conditions = shippingServiceSchema([method])[0].shippingConditions;
    assert.equal(conditions.length, 1);
    assert.equal(conditions[0].orderValue.minValue, 0);
    assert.equal(conditions[0].orderValue.maxValue, undefined);
    assert.equal(conditions[0].shippingRate.value, 0);
  }
});

test("delivery without a free rule has no fictional threshold and distinct services stay separate", () => {
  const express = { ...standard, id: "2-1", name: "Express", pricePence: 699, freeShippingRules: [] };
  const services = shippingServiceSchema([standard, express]);
  assert.equal(new Set(services.map((service) => service["@id"])).size, 2);
  assert.equal(services[1].shippingConditions.length, 1);
  assert.equal(services[1].shippingConditions[0].orderValue.maxValue, undefined);
  assert.equal(services[1].shippingConditions[0].shippingRate.value, 6.99);
  assert.doesNotMatch(services[1].description, /Free shipping/);
});

test("pickup, postcode-restricted rates, invalid amounts and mixed bases are not advertised countrywide", () => {
  const methods: PublicShippingMethod[] = [
    { ...standard, methodType: "LOCAL_PICKUP" },
    { ...standard, isCountrywide: false, postcodes: ["BT*"] },
    { ...standard, pricePence: NaN },
    { ...standard, pricePence: -1 },
    { ...standard, freeShippingRules: [{ ...standard.freeShippingRules[0], minimumSubtotalPence: -1 }] },
    { ...standard, freeShippingRules: [standard.freeShippingRules[0],
      { ...standard.freeShippingRules[0], id: "2", thresholdBasis: "AFTER_DISCOUNT" }] },
  ];
  assert.deepEqual(shippingServiceSchema(methods), []);
});

test("product fields use the visible price, actual brand, SKU, images and bottle format", () => {
  const data = productStructuredData(product, reviews);
  assert.equal(data.offers.price, "37.01");
  assert.equal(data.offers.priceCurrency, "GBP");
  assert.equal(data.brand?.name, "Yusuf Bhai");
  assert.notEqual(data.brand?.name, product.inspiredBy);
  assert.equal(data.sku, product.sku);
  assert.equal(data.size, "100ml");
  assert.equal(data.category, "Perfume");
  assert.deepEqual(data.image, [storefrontUrl("/media/example.webp")]);
  assert.equal(data.offers.availability, "https://schema.org/InStock");
  assert.equal("hasVariant" in data, false);
  const missing = productStructuredData({ ...product, sku: "", variantTitle: "", brand: null }, noReviews);
  assert.equal("sku" in missing, false);
  assert.equal("size" in missing, false);
  assert.equal("brand" in missing, false);
});

test("sold-out and untracked bottles retain the same availability rules as checkout", () => {
  assert.equal(productStructuredData({ ...product, stockOnHand: 0 }, noReviews).offers.availability, "https://schema.org/OutOfStock");
  assert.equal(productStructuredData({ ...product, stockOnHand: 0, trackInventory: false }, noReviews).offers.availability, "https://schema.org/InStock");
});

test("bundle schema uses the pack format and all component inventory rather than a 100ml bottle claim", () => {
  const bundle: StorefrontBundle = {
    ...product, productType: "BUNDLE", slug: "example-bundle", variantTitle: "3 × 100ml set", brand: "N7 Cosmetics",
    componentsAvailable: true,
    components: [{ productId: "50", variantId: "51", slug: "included-perfume", name: "Included perfume",
      productCode: null, variantTitle: "100ml", pricePence: 1500, stockOnHand: 1, trackInventory: true,
      quantity: 2, image: "/media/included.webp", imageAlt: "Included perfume" }],
  };
  const node = productStructuredData(bundle, noReviews);
  assert.equal(node.url, storefrontUrl("/bundles/example-bundle"));
  assert.equal(node.size, "3 × 100ml set");
  assert.equal(node.offers.availability, "https://schema.org/OutOfStock");
  assert.equal(productStructuredData({ ...bundle, componentsAvailable: false }, noReviews).offers.availability, "https://schema.org/OutOfStock");
  assert.equal(productStructuredData({ ...bundle, components: [] }, noReviews).offers.availability, "https://schema.org/OutOfStock");
});

test("review markup uses published author, text, explicit stars and dates without requiring a purchase badge", () => {
  const data = productRatingsSchema(reviews);
  assert.equal(data.aggregateRating?.ratingValue, 4.5);
  assert.equal(data.aggregateRating?.reviewCount, 2);
  assert.equal(data.review?.[0].author.name, "Customer One");
  assert.equal(data.review?.[0].reviewBody, "Fresh and long lasting.");
  assert.equal(data.review?.[0].reviewRating.ratingValue, 5);
  assert.equal(data.review?.[0].datePublished, "2026-07-06");
  assert.equal(data.review?.[1].name, "Lovely fragrance");
  assert.deepEqual(productRatingsSchema(noReviews), {});
});

test("invalid review stars are never inferred from positive text and malformed dates are omitted", () => {
  const invalid = productRatingsSchema({ ...reviews, reviews: reviews.reviews.map((review) => ({ ...review, rating: 0 })) });
  assert.deepEqual(invalid, {});
  const badDate = productRatingsSchema({ ...reviews, reviews: reviews.reviews.map((review) => ({ ...review, publishedAt: new Date(NaN) })) });
  assert.equal(badDate.review?.[0].datePublished, undefined);
  assert.equal(productRatingsSchema({ ...reviews, averageRating: NaN }).aggregateRating, undefined);
});

test("visible breadcrumbs and schema share the same trail, including products without a collection", () => {
  for (const value of [product, { ...product, collectionSlug: null, collectionName: null }, { ...product, productType: "BUNDLE" as const }]) {
    const visible = productBreadcrumbs(value);
    const schema = breadcrumbSchema(value);
    assert.deepEqual(schema.itemListElement.map((item) => item.name), visible.map((item) => item.name));
    assert.deepEqual(schema.itemListElement.map((item) => item.item), visible.map((item) => storefrontUrl(item.href)));
    assert.deepEqual(schema.itemListElement.map((item) => item.position), visible.map((_, index) => index + 1));
  }
  assert.deepEqual(productBreadcrumbs(product).map((item) => item.name), ["Home", "Recreations", "Example Perfume"]);
});

test("admin-controlled JSON-LD content cannot end the script and survives JSON round trips", () => {
  const hostileProduct = { ...product, name: '</script><script>alert("x")</script>', description: "<b>Perfume</b>" };
  const data = makeProductPageSchema(hostileProduct, reviews, store);
  const serialized = structuredDataJson(data);
  assert.equal(serialized.includes("<"), false);
  const parsed: unknown = JSON.parse(serialized);
  const expected: unknown = JSON.parse(JSON.stringify(data));
  assert.deepEqual(parsed, expected);
});

test("canonical URLs and IDs consistently use APP_URL with a fallback for malformed configuration", () => {
  const original = process.env.APP_URL;
  try {
    process.env.APP_URL = "https://n7cosmetics.co.uk/";
    assert.equal(storefrontUrl("/#organization"), "https://n7cosmetics.co.uk/#organization");
    assert.equal(makeProductPageSchema(product, noReviews, store)["@graph"][1]["@id"], "https://n7cosmetics.co.uk/products/example-perfume#product");
    process.env.APP_URL = "invalid-url";
    assert.equal(storefrontUrl("/shipping-returns"), "https://n7cosmetics.co.uk/shipping-returns");
  } finally {
    if (original === undefined) delete process.env.APP_URL;
    else process.env.APP_URL = original;
  }
});
