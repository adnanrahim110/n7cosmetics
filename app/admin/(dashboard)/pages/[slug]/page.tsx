import type { ReactNode } from "react";
import type { RowDataPacket } from "mysql2/promise";
import { ArrowLeft, ArrowUpRight, Images, LayoutTemplate } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import CustomSelect, { type CustomSelectOption } from "@/components/admin/CustomSelect";
import Notice from "@/components/admin/Notice";
import PageHeader from "@/components/admin/PageHeader";
import StorefrontComingSoonEditor from "@/components/admin/StorefrontComingSoonEditor";
import { getStorefrontPageConfiguration } from "@/lib/commerce/collections";
import { selectRows } from "@/lib/db/query";
import { isEditableStorefrontPageSlug, storefrontPageDefinitions } from "@/lib/storefront-pages/config";
import { saveStorefrontPageDetailAction, saveStorefrontPageHeroAction } from "./actions";

interface ProductOptionRow extends RowDataPacket {
  id: string;
  name: string;
  sku: string | null;
  image_url: string | null;
}

const input = "mt-1 w-full rounded-md border border-zinc-300 bg-white px-2.5 py-2 text-sm leading-5 outline-none transition focus:border-amber-700 focus:ring-2 focus:ring-amber-100";
const label = "block text-[13px] font-medium leading-5 text-zinc-700";

function Block({
  id,
  icon,
  title,
  description,
  action,
  children,
}: {
  id: string;
  icon: ReactNode;
  title: string;
  description: string;
  action: (formData: FormData) => void | Promise<void>;
  children: ReactNode;
}) {
  return (
    <details className="group scroll-mt-20 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm open:border-zinc-300" id={id} open>
      <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4 marker:content-none hover:bg-zinc-50">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-800">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-zinc-950">{title}</span>
          <span className="mt-0.5 block text-xs leading-5 text-zinc-500">{description}</span>
        </span>
        <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-lg border border-zinc-200 text-zinc-500 transition group-open:rotate-180">⌄</span>
      </summary>
      <form action={action} className="border-t border-zinc-100 p-5">
        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">{children}</div>
        <div className="mt-5 flex justify-end border-t border-zinc-100 pt-4">
          <button className="rounded-lg bg-zinc-950 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-zinc-800" type="submit">Save changes</button>
        </div>
      </form>
    </details>
  );
}

export default async function StorefrontPageEditor({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  if (!isEditableStorefrontPageSlug(slug)) notFound();

  const [configuration, products] = await Promise.all([
    getStorefrontPageConfiguration(slug),
    selectRows<ProductOptionRow>(
      `SELECT CAST(p.id AS CHAR) AS id, p.name, v.sku,
         (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order, pi.id LIMIT 1) AS image_url
       FROM products p
       LEFT JOIN product_variants v ON v.product_id = p.id AND v.is_default = 1
       WHERE p.status = 'ACTIVE'
       ORDER BY p.name`,
    ),
  ]);
  const definition = storefrontPageDefinitions[slug];
  const productOptions: CustomSelectOption[] = products.map((product) => ({
    value: product.id,
    label: product.name,
    description: product.sku ?? undefined,
    mediaUrl: product.image_url,
    mediaType: "image",
  }));
  const saveHero = saveStorefrontPageHeroAction.bind(null, slug);
  const saveDetail = saveStorefrontPageDetailAction.bind(null, slug);

  return (
    <div className="max-w-6xl">
      <PageHeader
        actions={(
          <>
            <Link className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50" href="/admin/pages"><ArrowLeft aria-hidden="true" size={14} /> Pages</Link>
            <Link className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800" href={definition.path} target="_blank">View page <ArrowUpRight aria-hidden="true" size={14} /></Link>
          </>
        )}
        description="Edit page-specific copy and product curation. The established storefront layout, colors, animations, and catalog behavior remain unchanged."
        eyebrow="Storefront page"
        title={definition.name}
      />

      {query.saved ? <Notice type="success">{query.saved === "hero" ? "Hero section" : "Detail section"} saved.</Notice> : null}
      {query.error ? <Notice>Check the fields and product selections in the {query.error} section.</Notice> : null}

      <div className="mt-6 space-y-4">
        <Block action={saveHero} description="Page-specific headline, supporting copy, highlights, and up to three featured products." icon={<Images aria-hidden="true" size={18} />} id="hero" title="Hero section">
          <label className={label}>Eyebrow<input className={input} defaultValue={configuration.hero.eyebrow} maxLength={160} name="eyebrow" required /></label>
          <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
            <label className={label}>Title<input className={input} defaultValue={configuration.hero.title.lead} maxLength={160} name="titleLead" required /></label>
            <label className={label}>Accent title<input className={input} defaultValue={configuration.hero.title.accent} maxLength={160} name="titleAccent" required /></label>
          </div>
          <label className={`${label} sm:col-span-2`}>Introductory copy<textarea className={input} defaultValue={configuration.hero.intro} maxLength={1600} name="intro" required rows={3} /></label>
          <label className={`${label} sm:col-span-2`}>Statement<textarea className={input} defaultValue={configuration.hero.statement} maxLength={500} name="statement" required rows={2} /></label>
          <fieldset className="grid gap-3 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 sm:col-span-2 sm:grid-cols-3">
            <legend className="px-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-600">Hero highlights</legend>
            {configuration.hero.highlights.slice(0, 3).map((highlight, index) => <label className={label} key={index}>Highlight {index + 1}<input className={input} defaultValue={highlight} maxLength={160} name="highlights" required /></label>)}
          </fieldset>
          <div className="sm:col-span-2">
            <CustomSelect defaultValue={configuration.hero.productIds} label="Hero products" maximumSelected={3} multiple name="productIds" options={productOptions} placeholder="Use collection products automatically" />
            <p className="mt-1.5 text-[11px] leading-5 text-zinc-500">Choose up to three database products in display order. Leave empty to select automatically from this page&apos;s database collection.</p>
          </div>
        </Block>

        <Block action={saveDetail} description="The page-specific header and optional coming-soon state for the database-driven product index." icon={<LayoutTemplate aria-hidden="true" size={18} />} id="detail" title="Detail section">
          <label className={label}>Eyebrow<input className={input} defaultValue={configuration.detail.eyebrow} maxLength={160} name="eyebrow" required /></label>
          <label className={label}>Section title<input className={input} defaultValue={configuration.detail.title} maxLength={190} name="title" required /></label>
          <label className={`${label} sm:col-span-2`}>Header statement<textarea className={input} defaultValue={configuration.detail.description} maxLength={1000} name="description" required rows={3} /></label>
          <label className={`${label} sm:col-span-2`}>Credit line<input className={input} defaultValue={configuration.detail.credit} maxLength={190} name="credit" required /></label>
          <StorefrontComingSoonEditor content={configuration.detail.comingSoon} />
        </Block>
      </div>
    </div>
  );
}
