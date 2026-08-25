import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, Check, ChevronDown, Clock3, PackageCheck, ShieldCheck, Sparkles, Truck } from "lucide-react";
import ProductDetailActions from "@/components/commerce/ProductDetailActions";
import ProductGallery from "@/components/commerce/ProductGallery";
import ProductReviews from "@/components/commerce/ProductReviews";
import RatingStars from "@/components/commerce/RatingStars";
import RelatedProductsSlider from "@/components/commerce/RelatedProductsSlider";
import { getRelatedStorefrontProducts, getStorefrontProduct } from "@/lib/commerce/catalog";
import { getProductReviewSummary } from "@/lib/commerce/reviews";

export const dynamic = "force-dynamic";

interface ProductPageProps { params: Promise<{ slug: string }> }

function absoluteUrl(path: string): string {
  const fallback = "https://n7cosmetics.co.uk";
  try { return new URL(path, process.env.APP_URL || fallback).toString(); }
  catch { return new URL(path, fallback).toString(); }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getStorefrontProduct((await params).slug);
  if (!product) return {};
  const description = product.seoDescription ?? product.shortDescription ?? product.description ?? undefined;
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

function money(pence: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getStorefrontProduct((await params).slug);
  if (!product) notFound();
  const [reviewSummary, relatedProducts] = await Promise.all([
    getProductReviewSummary(product.id),
    getRelatedStorefrontProducts(product.id, product.audience),
  ]);
  const commerceProduct = { slug: product.slug, name: product.name, image: product.image, pricePence: product.pricePence };
  const soldOut = product.trackInventory && product.stockOnHand <= 0;
  const lowStock = product.trackInventory && product.stockOnHand > 0 && product.stockOnHand <= 5;
  const saving = product.compareAtPricePence ? Math.round((1 - product.pricePence / product.compareAtPricePence) * 100) : null;
  const noteGroups = [
    { label: "Opening", caption: "Top notes", notes: product.noteGroups.top },
    { label: "The heart", caption: "Heart notes", notes: product.noteGroups.heart },
    { label: "The trail", caption: "Base notes", notes: product.noteGroups.base },
  ].filter((group) => group.notes.length);
  const gallery = [
    ...product.images.map((image) => ({ url: image.url, type: "image" as const, alt: image.alt })),
    ...product.videos.map((video) => ({ url: video.url, type: "video" as const, alt: video.title })),
  ];

  return (
    <div className="min-h-screen bg-[#f3eee5] text-[#1c1814]">
      <main className="pb-16 pt-36 sm:pb-24 sm:pt-44">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-black/38">
            <Link className="inline-flex items-center gap-2 transition hover:text-black" href={`/${product.collectionSlug ?? "yusuf-bhai-originals"}`}><ArrowLeft size={13} />Collection</Link>
            <span aria-hidden="true">/</span>
            <span className="max-w-56 truncate text-black/62">{product.name}</span>
          </nav>

          <div className="mt-7 grid gap-10 lg:grid-cols-[1.06fr_0.94fr] lg:items-start lg:gap-14 xl:gap-20">
            <ProductGallery items={gallery} productName={product.name} />

            <div className="lg:sticky lg:top-28">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8d6745]">{product.brand ?? "N7 Cosmetics"} · {product.audience.toLowerCase()}</p>
                <p className="text-[9px] uppercase tracking-[0.18em] text-black/32">Ref. {product.sku}</p>
              </div>
              <h1 className="mt-4 break-words font-heading text-4xl font-normal leading-[0.98] text-[#1c1814] sm:text-5xl xl:text-6xl">{product.name}</h1>
              {product.inspiredBy ? <p className="mt-3 font-heading text-base italic text-black/46">Inspired by {product.inspiredBy}</p> : null}

              <a className="mt-5 inline-flex items-center gap-3 text-xs text-black/55 transition hover:text-black" href="#reviews">
                <RatingStars rating={reviewSummary.averageRating} size={14} />
                <span>{reviewSummary.totalReviews ? `${reviewSummary.averageRating.toFixed(1)} · ${reviewSummary.totalReviews} ${reviewSummary.totalReviews === 1 ? "review" : "reviews"}` : "No reviews yet"}</span>
              </a>

              <p className="mt-6 max-w-xl text-base font-light leading-7 text-black/62">{product.shortDescription ?? product.description ?? "A distinctive fragrance composed for a memorable signature."}</p>

              <div className="mt-7 flex flex-wrap items-end gap-x-4 gap-y-2 border-b border-black/12 pb-7">
                <span className="font-heading text-3xl font-normal sm:text-4xl">{money(product.pricePence)}</span>
                {product.compareAtPricePence ? <span className="pb-1 text-base text-black/32 line-through">{money(product.compareAtPricePence)}</span> : null}
                {saving ? <span className="mb-1 bg-[#8d6745] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white">Save {saving}%</span> : null}
              </div>

              <div className="mt-6">
                <div className="flex items-end justify-between gap-4">
                  <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/45">Size</p><p className="mt-2 text-sm font-medium">{product.variantTitle}</p></div>
                  <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${soldOut ? "text-red-700" : lowStock ? "text-[#9a5f2f]" : "text-[#66704b]"}`}>{soldOut ? "Out of stock" : lowStock ? `Only ${product.stockOnHand} left` : "In stock"}</p>
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
                  <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-[10px] font-semibold uppercase tracking-[0.18em]"><span>About the fragrance</span><ChevronDown className="transition group-open:rotate-180" size={15} /></summary>
                  <p className="whitespace-pre-line pb-5 text-sm font-light leading-7 text-black/58">{product.description ?? product.shortDescription ?? "A distinctive fragrance composed for a memorable signature."}</p>
                </details>
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-[10px] font-semibold uppercase tracking-[0.18em]"><span>Product details</span><ChevronDown className="transition group-open:rotate-180" size={15} /></summary>
                  <dl className="grid grid-cols-2 gap-x-5 gap-y-3 pb-5 text-sm">
                    <div><dt className="text-black/38">Format</dt><dd className="mt-1">{product.variantTitle}</dd></div>
                    <div><dt className="text-black/38">Audience</dt><dd className="mt-1 capitalize">{product.audience.toLowerCase()}</dd></div>
                    <div><dt className="text-black/38">Brand</dt><dd className="mt-1">{product.brand ?? "N7 Cosmetics"}</dd></div>
                    {product.weightGrams ? <div><dt className="text-black/38">Pack weight</dt><dd className="mt-1">{product.weightGrams} g</dd></div> : null}
                  </dl>
                </details>
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-[10px] font-semibold uppercase tracking-[0.18em]"><span>Delivery &amp; returns</span><ChevronDown className="transition group-open:rotate-180" size={15} /></summary>
                  <p className="pb-5 text-sm font-light leading-7 text-black/58">Delivery options are calculated at checkout. For returns eligibility and timeframes, see our <Link className="text-[#7a5825] underline underline-offset-4" href="/shipping-returns">shipping and returns policy</Link>.</p>
                </details>
              </div>
            </div>
          </div>
        </div>

        {noteGroups.length ? (
          <section className="mt-20 overflow-hidden bg-[#17130f] py-16 text-[#f3eee5] sm:mt-28 sm:py-24">
            <div className="mx-auto max-w-7xl px-5 sm:px-8">
              <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
                <div><Sparkles className="text-[#b99a6c]" size={20} strokeWidth={1.3} /><p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#b99a6c]">The composition</p><h2 className="mt-4 font-heading text-4xl font-normal leading-none text-[#f3eee5] sm:text-5xl">A fragrance<br /><span className="italic text-[#b99a6c]">in three acts.</span></h2></div>
                <p className="max-w-xl text-sm font-light leading-7 text-white/48 lg:justify-self-end">From the first impression to the lasting trail, each layer unfolds with its own texture and character.</p>
              </div>
              <div className={`mt-12 grid border-y border-white/12 ${noteGroups.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                {noteGroups.map((group, index) => (
                  <article className="border-b border-white/12 py-8 last:border-b-0 lg:border-b-0 lg:border-r lg:px-8 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0" key={group.label}>
                    <div className="flex items-center justify-between"><p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#b99a6c]">{group.caption}</p><span className="font-heading text-xl italic text-white/18">0{index + 1}</span></div>
                    <h3 className="mt-5 font-heading text-3xl font-normal text-[#f3eee5]">{group.label}</h3>
                    <p className="mt-4 text-sm font-light leading-7 text-white/50">{group.notes.join(" · ")}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="bg-[#f3eee5] py-12 sm:py-16">
          <div className="mx-auto grid max-w-7xl gap-px bg-black/10 px-5 sm:grid-cols-3 sm:px-8">
            {[{ icon: PackageCheck, title: "Packed with care", text: "Prepared and checked by the N7 team." }, { icon: Clock3, title: "Inventory confirmed", text: "Availability is verified when you order." }, { icon: Check, title: "Customer support", text: "Our team is here before and after delivery." }].map(({ icon: Icon, title, text }) => (
              <div className="flex gap-4 bg-[#f3eee5] py-5 sm:px-6" key={title}><Icon className="mt-0.5 shrink-0 text-[#8d6745]" size={19} strokeWidth={1.4} /><div><h3 className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-[#1c1814]">{title}</h3><p className="mt-2 text-xs font-light leading-5 text-black/46">{text}</p></div></div>
            ))}
          </div>
        </section>

        <RelatedProductsSlider products={relatedProducts} />
      </main>

      <ProductReviews productId={product.id} productName={product.name} productSlug={product.slug} summary={reviewSummary} />
    </div>
  );
}
