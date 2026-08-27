import ProductDetailActions from "@/components/commerce/ProductDetailActions";
import ProductGallery from "@/components/commerce/ProductGallery";
import ProductReviews from "@/components/commerce/ProductReviews";
import Title from "@/components/ui/Title";
import RatingStars from "@/components/commerce/RatingStars";
import { getStorefrontBundle } from "@/lib/commerce/bundles";
import { getProductReviewSummary } from "@/lib/commerce/reviews";
import { ArrowLeft, BadgeCheck, Check, ChevronDown, Clock3, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface BundlePageProps {
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

function money(pence: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
}

export async function generateMetadata({ params }: BundlePageProps): Promise<Metadata> {
  const bundle = await getStorefrontBundle((await params).slug);
  if (!bundle) return {};
  const description = bundle.seoDescription ?? bundle.shortDescription ?? bundle.description ?? undefined;
  const image = bundle.images[0] ? absoluteUrl(bundle.images[0].url) : null;
  return {
    title: bundle.seoTitle ?? `${bundle.name} | N7 Cosmetics`,
    description,
    alternates: { canonical: `/bundles/${bundle.slug}` },
    openGraph: {
      title: bundle.seoTitle ?? bundle.name,
      description,
      type: "website",
      images: image ? [{ url: image, alt: bundle.images[0].alt }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: bundle.seoTitle ?? bundle.name,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function BundlePage({ params }: BundlePageProps) {
  const bundle = await getStorefrontBundle((await params).slug);
  if (!bundle) notFound();
  const reviewSummary = await getProductReviewSummary(bundle.id);
  const componentSoldOut = bundle.components.some((component) => component.trackInventory && component.stockOnHand < component.quantity);
  const soldOut = (bundle.trackInventory && bundle.stockOnHand <= 0) || componentSoldOut || !bundle.componentsAvailable;
  const lowStock = !soldOut && bundle.trackInventory && bundle.stockOnHand <= 5;
  const saving = bundle.compareAtPricePence ? Math.round((1 - bundle.pricePence / bundle.compareAtPricePence) * 100) : null;
  const gallery = [
    ...bundle.images.map((image) => ({ url: image.url, type: "image" as const, alt: image.alt })),
    ...bundle.videos.map((video) => ({ url: video.url, type: "video" as const, alt: video.title })),
  ];
  const commerceProduct = {
    slug: bundle.slug,
    href: `/bundles/${bundle.slug}`,
    name: bundle.name,
    image: bundle.image,
    pricePence: bundle.pricePence,
  };

  return (
    <div className="min-h-screen bg-[#f3eee5] text-[#1c1814]">
      <main className="pb-16 pt-36 sm:pb-24 sm:pt-44">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-black/38">
            <Link className="inline-flex items-center gap-2 transition hover:text-black" href="/bundles"><ArrowLeft size={13} />Bundles</Link>
            <span aria-hidden="true">/</span>
            <span className="max-w-56 truncate text-black/62">{bundle.name}</span>
          </nav>

          <div className="mt-7 grid gap-10 lg:grid-cols-[1.06fr_0.94fr] lg:items-start lg:gap-14 xl:gap-20">
            <ProductGallery items={gallery} productName={bundle.name} />

            <div className="lg:sticky lg:top-28">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8d6745]">N7 Cosmetics · Curated bundle</p>
                <p className="text-[9px] uppercase tracking-[0.18em] text-black/32">Ref. {bundle.sku}</p>
              </div>
              <Title as="h1" className="mt-4" text={bundle.name} tone="ink" />
              <a className="mt-5 inline-flex items-center gap-3 text-xs text-black/55 transition hover:text-black" href="#reviews">
                <RatingStars rating={reviewSummary.averageRating} size={14} />
                <span>{reviewSummary.totalReviews ? `${reviewSummary.averageRating.toFixed(1)} · ${reviewSummary.totalReviews} ${reviewSummary.totalReviews === 1 ? "review" : "reviews"}` : "No reviews yet"}</span>
              </a>
              <p className="mt-6 max-w-xl text-base font-light leading-7 text-black/62">{bundle.shortDescription ?? bundle.description ?? "A considered selection of N7 fragrances, curated to be enjoyed together."}</p>

              <section className="mt-7 border-y border-black/12 py-6" aria-labelledby="bundle-products-title">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#8d6745]">The complete set</p>
                    <Title
                      className="mt-2"
                      id="bundle-products-title"
                      text="Included products"
                      tone="gold"
                      variant="small"
                    />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-black/35">{bundle.components.length} selected</span>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {bundle.components.map((component) => (
                    <Link className="group grid grid-cols-[68px_minmax(0,1fr)] items-center gap-3 border border-black/10 bg-white/35 p-2.5 transition hover:border-[#8d6745]/45 hover:bg-white/60" href={`/products/${component.slug}`} key={component.variantId}>
                      <span className="relative aspect-square overflow-hidden bg-[#e8dfd1]"><Image alt={component.imageAlt} className="object-contain p-1.5" fill sizes="68px" src={component.image} /></span>
                      <span className="min-w-0">
                        <span className="flex items-start justify-between gap-2"><span className="line-clamp-2 font-heading text-base leading-tight group-hover:text-[#8d6745]">{component.name}</span><Check className="mt-0.5 shrink-0 text-[#66704b]" size={14} /></span>
                        <span className="mt-1 block text-[10px] uppercase tracking-[0.12em] text-black/38">{component.quantity > 1 ? `${component.quantity} × ` : ""}{component.variantTitle}</span>
                      </span>
                    </Link>
                  ))}
                </div>
                {!bundle.components.length ? <p className="mt-5 text-sm text-red-700">This bundle is being prepared and cannot be purchased yet.</p> : null}
              </section>

              <div className="mt-7 flex flex-wrap items-end gap-x-4 gap-y-2 border-b border-black/12 pb-7">
                <span className="font-heading text-3xl font-normal sm:text-4xl">{money(bundle.pricePence)}</span>
                {bundle.compareAtPricePence ? <span className="pb-1 text-base text-black/32 line-through">{money(bundle.compareAtPricePence)}</span> : null}
                {saving ? <span className="mb-1 bg-[#8d6745] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white">Save {saving}%</span> : null}
              </div>

              <div className="mt-6">
                <div className="flex items-end justify-between gap-4">
                  <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/45">Format</p><p className="mt-2 text-sm font-medium">{bundle.variantTitle}</p></div>
                  <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${soldOut ? "text-red-700" : lowStock ? "text-[#9a5f2f]" : "text-[#66704b]"}`}>{soldOut ? "Out of stock" : lowStock ? `Only ${bundle.stockOnHand} left` : "In stock"}</p>
                </div>
                <ProductDetailActions product={commerceProduct} soldOut={soldOut} />
              </div>

              <div className="mt-7 grid grid-cols-3 gap-px border border-black/10 bg-black/10">
                {[{ icon: Truck, label: "UK delivery" }, { icon: ShieldCheck, label: "Secure pay" }, { icon: BadgeCheck, label: "Authentic" }].map(({ icon: Icon, label }) => (
                  <div className="grid min-h-22 place-items-center bg-[#f3eee5] px-2 py-4 text-center" key={label}><Icon className="text-[#8d6745]" size={18} strokeWidth={1.4} /><span className="mt-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-black/46">{label}</span></div>
                ))}
              </div>

              <div className="mt-7 divide-y divide-black/12 border-y border-black/12">
                <details className="group" open>
                  <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-[10px] font-semibold uppercase tracking-[0.18em]"><span>About the bundle</span><ChevronDown className="transition group-open:rotate-180" size={15} /></summary>
                  <p className="whitespace-pre-line pb-5 text-sm font-light leading-7 text-black/58">{bundle.description ?? bundle.shortDescription ?? "A considered selection of N7 fragrances, curated to be enjoyed together."}</p>
                </details>
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-[10px] font-semibold uppercase tracking-[0.18em]"><span>Bundle details</span><ChevronDown className="transition group-open:rotate-180" size={15} /></summary>
                  <dl className="grid grid-cols-2 gap-x-5 gap-y-3 pb-5 text-sm"><div><dt className="text-black/38">Format</dt><dd className="mt-1">{bundle.variantTitle}</dd></div><div><dt className="text-black/38">Products</dt><dd className="mt-1">{bundle.components.reduce((total, component) => total + component.quantity, 0)} included</dd></div>{bundle.weightGrams ? <div><dt className="text-black/38">Pack weight</dt><dd className="mt-1">{bundle.weightGrams} g</dd></div> : null}</dl>
                </details>
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-[10px] font-semibold uppercase tracking-[0.18em]"><span>Delivery &amp; returns</span><ChevronDown className="transition group-open:rotate-180" size={15} /></summary>
                  <p className="pb-5 text-sm font-light leading-7 text-black/58">Delivery options are calculated at checkout. For returns eligibility and timeframes, see our <Link className="text-[#7a5825] underline underline-offset-4" href="/shipping-returns">shipping and returns policy</Link>.</p>
                </details>
              </div>
            </div>
          </div>
        </div>

        <section className="bg-[#f3eee5] py-12 sm:py-16">
          <div className="mx-auto grid max-w-7xl gap-px bg-black/10 px-5 sm:grid-cols-3 sm:px-8">
            {[{ icon: PackageCheck, title: "Packed together", text: "Every included product is checked by the N7 team." }, { icon: Clock3, title: "Inventory confirmed", text: "Availability is verified when you order." }, { icon: Check, title: "Customer support", text: "Our team is here before and after delivery." }].map(({ icon: Icon, title, text }) => (
              <div className="flex gap-4 bg-[#f3eee5] py-5 sm:px-6" key={title}><Icon className="mt-0.5 shrink-0 text-[#8d6745]" size={19} strokeWidth={1.4} /><div><h3 className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-[#1c1814]">{title}</h3><p className="mt-2 text-xs font-light leading-5 text-black/46">{text}</p></div></div>
            ))}
          </div>
        </section>
      </main>

      <ProductReviews productId={bundle.id} productName={bundle.name} productSlug={bundle.slug} summary={reviewSummary} />
    </div>
  );
}
