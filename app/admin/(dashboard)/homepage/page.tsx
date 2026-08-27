import type { ReactNode } from "react";
import type { RowDataPacket } from "mysql2/promise";
import CustomSelect from "@/components/admin/CustomSelect";
import DestinationSelect from "@/components/admin/DestinationSelect";
import { FooterLinksEditor, ReviewsEditor } from "@/components/admin/ContentListEditor";
import HeroProductsEditor from "@/components/admin/HeroProductsEditor";
import MediaDropzone from "@/components/admin/MediaDropzone";
import NavigationEditor from "@/components/admin/NavigationEditor";
import Notice from "@/components/admin/Notice";
import PageHeader from "@/components/admin/PageHeader";
import { destinationFromHref } from "@/lib/admin/destination";
import { getGlobalStorefrontContent, getHomepageConfiguration } from "@/lib/commerce/homepage";
import { getAvailableSaleNavigationItems } from "@/lib/commerce/sales";
import { selectRows } from "@/lib/db/query";
import {
  saveAudienceAction, saveBrandFilmAction, saveFooterAction, saveHeaderAction, saveHeroAction,
  saveFeaturesAction, saveRecreationsAction, saveReviewsAction, saveScentStoryAction, saveSignatureAction, saveWeeklyAction,
} from "./actions";

interface ProductOption extends RowDataPacket { id: string; name: string; image_url: string | null; sku: string | null; short_description: string | null; description: string | null; brand: string | null; inspired_by: string | null }
const input = "mt-1 w-full rounded-md border border-zinc-300 bg-white px-2.5 py-2 text-sm leading-5 outline-none transition focus:border-amber-700 focus:ring-2 focus:ring-amber-100";
const label = "block text-[13px] font-medium leading-5 text-zinc-700";
const productOptions = (products: ProductOption[]) => products.map((product) => ({ value: product.id, label: product.name, description: product.sku ?? undefined, mediaUrl: product.image_url, mediaType: "image" as const }));
const mediaValue = (url: string, name: string, type: "image" | "video") => url ? [{ url, name, type }] : [];

function Block({ id, title, description, action, children, defaultOpen = false }: { id: string; title: string; description: string; action: (formData: FormData) => void | Promise<void>; children: ReactNode; defaultOpen?: boolean }) {
  return <details className="group scroll-mt-20 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm open:border-zinc-300" id={id} open={defaultOpen}><summary className="flex cursor-pointer list-none items-center gap-4 px-4 py-3 marker:content-none hover:bg-zinc-50"><span className="min-w-0 flex-1"><span className="block font-body text-sm font-semibold text-zinc-950">{title}</span><span className="mt-0.5 hidden truncate text-xs text-zinc-500 sm:block">{description}</span></span><span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-md border border-zinc-200 text-sm text-zinc-500 transition group-open:rotate-180">⌄</span></summary><form action={action} className="border-t border-zinc-100 p-4"><div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">{children}</div><div className="mt-4 flex justify-end border-t border-zinc-100 pt-3"><button className="rounded-md bg-zinc-950 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800" type="submit">Save changes</button></div></form></details>;
}

export default async function HomepagePage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const [configuration, global, products, sales, query] = await Promise.all([
    getHomepageConfiguration(), getGlobalStorefrontContent(),
    selectRows<ProductOption>(`SELECT CAST(p.id AS CHAR) AS id, p.name, p.short_description, p.description, p.brand, p.inspired_by, v.sku, (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order, pi.id LIMIT 1) AS image_url FROM products p LEFT JOIN product_variants v ON v.product_id = p.id AND v.is_default = 1 WHERE p.status = 'ACTIVE' ORDER BY p.name`),
    getAvailableSaleNavigationItems(),
    searchParams,
  ]);
  const options = productOptions(products);
  const heroEditorProducts = products.map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    imageUrl: product.image_url ?? "",
    description: product.description || product.short_description || `${product.name} fragrance from N7 Cosmetics.`,
    tagline: product.inspired_by ? `Inspired by ${product.inspired_by}` : product.brand || "N7 Cosmetics",
  }));
  const audienceCards = configuration.audience.cards.slice(0, 2);
  return <div className="max-w-6xl"><PageHeader eyebrow="Storefront" title="Home page content" description="Open a section to edit its content. Every section saves independently; storefront layouts and animations remain unchanged." />
    {query.saved ? <Notice type="success">{query.saved.replaceAll("-", " ")} saved.</Notice> : null}
    {query.error ? <Notice>Check the fields in the {query.error.replaceAll("-", " ")} block.</Notice> : null}
    <div className="mt-5 space-y-3">
      <Block action={saveHeaderAction} defaultOpen description="Top-bar messages and navigation content only. Logo, icons, responsive behavior, colors, and header UI stay fixed." id="header" title="Header">
        <label className={label}>Left top-bar message<input className={input} defaultValue={global.header.topbarText} maxLength={300} name="topbarText" required /></label>
        <label className={label}>Right top-bar message<input className={input} defaultValue={global.header.topbarRightText} maxLength={300} name="topbarRightText" required /></label>
        <div className="sm:col-span-2"><NavigationEditor defaultItems={global.header.navigation} saleOptions={sales.map((sale) => ({ name: sale.name, href: sale.href }))} /></div>
      </Block>

      <Block action={saveHeroAction} description="Select products and give each slide its own optional image and promotional copy. Blank fields fall back to the product catalog." id="hero" title="Hero products">
        <label className={label}>CTA label<input className={input} defaultValue={configuration.hero.ctaLabel} maxLength={120} name="ctaLabel" required /></label>
        <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2"><MediaDropzone accept="image" defaultAssets={mediaValue(configuration.hero.backgroundImage, "Hero background", "image")} label="Background image" name="backgroundImage" /><MediaDropzone accept="image" defaultAssets={mediaValue(configuration.hero.cloudImage, "Hero foreground", "image")} label="Foreground atmosphere image" name="cloudImage" /></div>
        <HeroProductsEditor defaultPresentations={configuration.hero.products} defaultProductIds={configuration.hero.productIds} products={heroEditorProducts} />
      </Block>

      <Block action={saveSignatureAction} description="Section copy and products displayed in the existing Signature Fragrances grid." id="signature-fragrances" title="Signature Fragrances">
        <label className={label}>Eyebrow<input className={input} defaultValue={configuration.signature.eyebrow} maxLength={150} name="eyebrow" required /></label>
        <label className={label}>Title<input className={input} defaultValue={configuration.signature.titleLead} maxLength={150} name="titleLead" required /></label>
        <label className={label}>Accent title<input className={input} defaultValue={configuration.signature.titleAccent} maxLength={150} name="titleAccent" required /></label>
        <label className={label}>CTA label<input className={input} defaultValue={configuration.signature.ctaLabel} maxLength={120} name="ctaLabel" required /></label>
        <label className={`${label} sm:col-span-2`}>Description<textarea className={input} defaultValue={configuration.signature.description} maxLength={1000} name="description" required rows={2} /></label>
        <DestinationSelect className="sm:col-span-2" defaultValue={destinationFromHref(configuration.signature.ctaUrl)} label="CTA destination" name="ctaUrl" required />
        <CustomSelect className="sm:col-span-2" defaultValue={configuration.signature.productIds} label="Products" multiple name="productIds" options={options} placeholder="Select signature products" required />
      </Block>

      <Block action={saveBrandFilmAction} description="Written content and the background video used by the current Brand Film player." id="brand-film" title="Brand Film">
        <label className={label}>Eyebrow<input className={input} defaultValue={configuration.brandFilm.eyebrow} maxLength={150} name="eyebrow" required /></label>
        <label className={label}>Title<input className={input} defaultValue={configuration.brandFilm.titleLead} maxLength={150} name="titleLead" required /></label>
        <label className={label}>Accent title<input className={input} defaultValue={configuration.brandFilm.titleAccent} maxLength={150} name="titleAccent" required /></label>
        <label className={label}>Location label<input className={input} defaultValue={configuration.brandFilm.location} maxLength={150} name="location" required /></label>
        <label className={`${label} sm:col-span-2`}>Description<textarea className={input} defaultValue={configuration.brandFilm.description} maxLength={1500} name="description" required rows={2} /></label>
        <label className={label}>Duration label<input className={input} defaultValue={configuration.brandFilm.duration} maxLength={100} name="duration" required /></label>
        <MediaDropzone accept="video" defaultAssets={mediaValue(configuration.brandFilm.video, "Brand film", "video")} label="Brand film video" name="video" />
      </Block>

      <Block action={saveRecreationsAction} description="Products and shared slider copy; the current slider design and motion remain fixed." id="recreations" title="Recreations Slider">
        <label className={label}>Section label<input className={input} defaultValue={configuration.recreations.label} maxLength={150} name="label" required /></label>
        <label className={label}>CTA label<input className={input} defaultValue={configuration.recreations.ctaLabel} maxLength={120} name="ctaLabel" required /></label>
        <label className={label}>Title<input className={input} defaultValue={configuration.recreations.titleLead} maxLength={150} name="titleLead" required /></label>
        <label className={label}>Accent title<input className={input} defaultValue={configuration.recreations.titleAccent} maxLength={150} name="titleAccent" required /></label>
        <label className={`${label} sm:col-span-2`}>Product description<textarea className={input} defaultValue={configuration.recreations.description} maxLength={1000} name="description" required rows={2} /></label>
        <label className={label}>Price label<input className={input} defaultValue={configuration.recreations.priceLabel} maxLength={80} name="priceLabel" required /></label>
        <label className={label}>Selector title<input className={input} defaultValue={configuration.recreations.selectorTitle} maxLength={150} name="selectorTitle" required /></label>
        <label className={`${label} sm:col-span-2`}>Selector instruction<input className={input} defaultValue={configuration.recreations.selectorDescription} maxLength={300} name="selectorDescription" required /></label>
        <CustomSelect className="sm:col-span-2" defaultValue={configuration.recreations.productIds} label="Products" multiple name="productIds" options={options} placeholder="Select recreation products" required />
      </Block>

      <Block action={saveWeeklyAction} description="Select one product and its section-specific promotional copy." id="fragrance-week" title="Fragrance of the Week">
        <CustomSelect defaultValue={configuration.weekly.productId} label="Featured product" name="productId" options={options} placeholder="Select a product" required />
        <label className={label}>Eyebrow<input className={input} defaultValue={configuration.weekly.eyebrow} maxLength={150} name="eyebrow" required /></label>
        <label className={label}>Title<input className={input} defaultValue={configuration.weekly.titleLead} maxLength={150} name="titleLead" required /></label>
        <label className={label}>Accent title<input className={input} defaultValue={configuration.weekly.titleAccent} maxLength={150} name="titleAccent" required /></label>
        <label className={`${label} sm:col-span-2`}>Promotional description <span className="font-normal text-zinc-400">(blank uses product description)</span><textarea className={input} defaultValue={configuration.weekly.description} maxLength={1000} name="description" rows={2} /></label>
        <label className={label}>CTA label<input className={input} defaultValue={configuration.weekly.ctaLabel} maxLength={120} name="ctaLabel" required /><span className="mt-1 block text-[11px] font-normal text-zinc-400">The selected product page is linked automatically.</span></label>
      </Block>

      <Block action={saveScentStoryAction} description="Copy and the two videos used by the existing Scent Story composition." id="scent-story" title="Scent Story">
        <div className="grid gap-3 sm:col-span-2 md:grid-cols-2"><label className={label}>Eyebrow<input className={input} defaultValue={configuration.scentStory.eyebrow} maxLength={150} name="eyebrow" required /></label><label className={label}>Film label<input className={input} defaultValue={configuration.scentStory.filmLabel} maxLength={150} name="filmLabel" required /></label><label className={label}>Detail video label<input className={input} defaultValue={configuration.scentStory.detailLabel} maxLength={150} name="detailLabel" required /></label><label className={label}>Duration label<input className={input} defaultValue={configuration.scentStory.duration} maxLength={100} name="duration" required /></label></div>
        <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2"><label className={label}>Title<input className={input} defaultValue={configuration.scentStory.titleLead} maxLength={150} name="titleLead" required /></label><label className={label}>Accent title<input className={input} defaultValue={configuration.scentStory.titleAccent} maxLength={150} name="titleAccent" required /></label></div>
        <label className={`${label} sm:col-span-2`}>Description<textarea className={input} defaultValue={configuration.scentStory.description} maxLength={2000} name="description" required rows={2} /></label>
        <label className={`${label} sm:col-span-2`}>Quote<textarea className={input} defaultValue={configuration.scentStory.quote} maxLength={1000} name="quote" required rows={2} /></label>
        <MediaDropzone accept="video" defaultAssets={mediaValue(configuration.scentStory.mainVideo, "Main scent story film", "video")} label="Main video" name="mainVideo" />
        <MediaDropzone accept="video" defaultAssets={mediaValue(configuration.scentStory.detailVideo, "Scent story detail film", "video")} label="Detail video" name="detailVideo" />
      </Block>

      <Block action={saveAudienceAction} description="Introductory copy and the two existing audience cards. Card layouts remain unchanged." id="audience-collections" title="Audience Collections">
        <label className={label}>Eyebrow<input className={input} defaultValue={configuration.audience.eyebrow} maxLength={150} name="eyebrow" required /></label>
        <label className={label}>Section title<input className={input} defaultValue={configuration.audience.title} maxLength={150} name="title" required /></label>
        <label className={label}>Highlighted title text<input className={input} defaultValue={configuration.audience.titleAccent} maxLength={150} name="titleAccent" required /></label>
        <label className={label}>Section description<textarea className={input} defaultValue={configuration.audience.description} maxLength={1000} name="description" required rows={2} /></label>
        {audienceCards.map((card, index) => <fieldset className="grid gap-x-4 gap-y-3 rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 sm:col-span-2 sm:grid-cols-2" key={index}><legend className="px-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-600">Audience card {index + 1}</legend><label className={label}>Eyebrow<input className={input} defaultValue={card.eyebrow} maxLength={150} name={`card${index}Eyebrow`} required /></label><label className={label}>Title<input className={input} defaultValue={card.title} maxLength={150} name={`card${index}Title`} required /></label><label className={`${label} sm:col-span-2`}>Description<textarea className={input} defaultValue={card.description} maxLength={1000} name={`card${index}Description`} required rows={2} /></label><label className={label}>CTA label<input className={input} defaultValue={card.ctaLabel} maxLength={120} name={`card${index}CtaLabel`} required /></label><DestinationSelect defaultValue={destinationFromHref(card.ctaUrl)} label="CTA destination" name={`card${index}CtaUrl`} required /><MediaDropzone accept="image" defaultAssets={mediaValue(card.image, `${card.title} product image`, "image")} label="Foreground image" name={`card${index}Image`} /><MediaDropzone accept="image" defaultAssets={mediaValue(card.background, `${card.title} background`, "image")} label="Background image" name={`card${index}Background`} /></fieldset>)}
      </Block>

      <Block action={saveReviewsAction} description="Section copy and the entries shown by the existing featured/supporting review layout." id="reviews" title="Reviews">
        <div className="grid gap-3 sm:col-span-2 md:grid-cols-3"><label className={label}>Eyebrow<input className={input} defaultValue={configuration.reviews.eyebrow} maxLength={150} name="eyebrow" required /></label><label className={label}>Title<input className={input} defaultValue={configuration.reviews.titleLead} maxLength={150} name="titleLead" required /></label><label className={label}>Accent title<input className={input} defaultValue={configuration.reviews.titleAccent} maxLength={150} name="titleAccent" required /></label></div>
        <label className={`${label} sm:col-span-2`}>Description<textarea className={input} defaultValue={configuration.reviews.description} maxLength={1500} name="description" required rows={2} /></label>
        <div className="sm:col-span-2"><ReviewsEditor defaultItems={configuration.reviews.reviews} /></div>
      </Block>

      <Block action={saveFeaturesAction} description="Service promises shown in the three-column strip at the end of the home page. Icons and layout remain fixed." id="features" title="Service Features">
        {configuration.features.items.slice(0, 3).map((feature, index) => <fieldset className="grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 sm:col-span-2 sm:grid-cols-2" key={index}><legend className="px-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-600">Feature {index + 1}</legend><label className={label}>Title<input className={input} defaultValue={feature.title} maxLength={150} name={`feature${index}Title`} required /></label><label className={label}>Subtitle<input className={input} defaultValue={feature.subtitle} maxLength={300} name={`feature${index}Subtitle`} required /></label></fieldset>)}
      </Block>

      <Block action={saveFooterAction} description="Footer copy and links only. Logo, colors, visual layout, and responsive behavior remain fixed." id="footer" title="Footer">
        <label className={`${label} sm:col-span-2`}>Description<textarea className={input} defaultValue={global.footer.description} maxLength={3000} name="description" required rows={2} /></label>
        <label className={label}>Newsletter title<input className={input} defaultValue={global.footer.newsletterTitle} maxLength={150} name="newsletterTitle" required /></label>
        <label className={label}>Newsletter input placeholder<input className={input} defaultValue={global.footer.newsletterPlaceholder} maxLength={120} name="newsletterPlaceholder" required /></label>
        <label className={`${label} sm:col-span-2`}>Newsletter description<textarea className={input} defaultValue={global.footer.newsletterDescription} maxLength={1000} name="newsletterDescription" required rows={2} /></label>
        <label className={label}>Newsletter button label<input className={input} defaultValue={global.footer.newsletterButtonLabel} maxLength={80} name="newsletterButtonLabel" required /></label>
        <label className={`${label} sm:col-span-2`}>Copyright<input className={input} defaultValue={global.footer.copyright} maxLength={300} name="copyright" required /></label>
        <div className="sm:col-span-2"><p className="mb-2 text-sm font-medium text-zinc-700">Legal/footer pages</p><FooterLinksEditor defaultItems={global.footer.legalLinks} /></div>
      </Block>
    </div>
  </div>;
}
