import type { RowDataPacket } from "mysql2/promise";
import { ArrowUpRight, BadgePercent, Blend, Crown, Gem, House, Layers3, PackageOpen, PencilLine } from "lucide-react";
import Link from "next/link";
import PageHeader from "@/components/admin/PageHeader";
import { selectRows } from "@/lib/db/query";
import { editableStorefrontPageSlugs, storefrontPageDefinitions } from "@/lib/storefront-pages/config";
import { categoryCollectionSlugs, categoryHref } from "@/lib/commerce/category-config";

interface SalePageRow extends RowDataPacket { id: string; name: string; slug: string; status: "DRAFT" | "ACTIVE" }
interface CategoryPageRow extends RowDataPacket { id: string; name: string; slug: string; status: string; collection_name: string; collection_slug: string; collection_status: string }

const iconBySlug = {
  n7: Gem,
  recreations: Blend,
  "yusuf-bhai-originals": Crown,
  "premium-collection": Layers3,
  bundles: PackageOpen,
} as const;

const fixedPages = [
  {
    name: "Homepage",
    description: "Manage the storefront hero, featured edits, storytelling sections, reviews, header, and footer.",
    editorPath: "/admin/homepage",
    storefrontPath: "/",
    Icon: House,
    note: "Existing editor",
  },
  ...editableStorefrontPageSlugs.map((slug) => ({
    name: storefrontPageDefinitions[slug].name,
    description: storefrontPageDefinitions[slug].description,
    editorPath: `/admin/pages/${slug}`,
    storefrontPath: storefrontPageDefinitions[slug].path,
    Icon: iconBySlug[slug],
    note: "Hero · Detail",
  })),
];

export default async function PagesPage() {
  const [sales, categories] = await Promise.all([selectRows<SalePageRow>(
    `SELECT CAST(id AS CHAR) AS id, name, slug, status
     FROM sales WHERE status != 'ARCHIVED' ORDER BY (status = 'ACTIVE') DESC, sort_order, created_at`,
  ), selectRows<CategoryPageRow>(
    `SELECT CAST(c.id AS CHAR) AS id, c.name, c.slug, c.status, col.name AS collection_name,
       col.slug AS collection_slug, col.status AS collection_status
     FROM categories c INNER JOIN collections col ON col.id = c.collection_id
     WHERE col.status != 'ARCHIVED' AND col.slug IN (${categoryCollectionSlugs.map(() => "?").join(", ")})
     ORDER BY col.sort_order, col.name, c.sort_order, c.name`, categoryCollectionSlugs,
  )]);
  const pages = [
    ...fixedPages,
    ...categories.map((category) => ({
      name: `${category.collection_name} / ${category.name}`,
      description: "Manage this category’s hero, featured products, detail section, and coming-soon content.",
      editorPath: `/admin/pages/category-${category.id}`,
      storefrontPath: categoryHref(category.collection_slug, category.slug),
      Icon: Layers3,
      note: category.status === "ACTIVE" && category.collection_status === "ACTIVE" ? "Category · Live" : "Category · Hidden",
    })),
    ...sales.map((sale) => ({
      name: sale.name,
      description: "Manage the editorial presentation and qualifying product curation for this sale on the shared Sale page.",
      editorPath: `/admin/pages/sale-${sale.id}`,
      storefrontPath: `/sale/${sale.slug}`,
      Icon: BadgePercent,
      note: sale.status === "ACTIVE" ? "Sale · Live" : "Sale · Draft",
    })),
  ];
  return (
    <div className="max-w-6xl">
      <PageHeader
        description="Choose a storefront page to manage its page-specific content and product curation. Storefront layouts, styling, and motion remain fixed."
        eyebrow="Storefront"
        title="Pages"
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {pages.map(({ name, description, editorPath, storefrontPath, Icon, note }) => (
          <article className="group flex min-h-64 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md" key={editorPath}>
            <div className="flex items-start justify-between gap-4 border-b border-zinc-100 bg-[linear-gradient(135deg,#fff_0%,#faf7f0_100%)] p-5">
              <span className="grid size-11 place-items-center rounded-xl border border-amber-100 bg-amber-50 text-amber-800 shadow-sm">
                <Icon aria-hidden="true" size={20} strokeWidth={1.7} />
              </span>
              <Link
                aria-label={`View ${name} on the storefront`}
                className="grid size-9 place-items-center rounded-lg border border-zinc-200 bg-white text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-950"
                href={storefrontPath}
                target="_blank"
              >
                <ArrowUpRight aria-hidden="true" size={16} />
              </Link>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.19em] text-amber-700">{note}</p>
              <h2 className="mt-2 text-lg font-semibold text-zinc-950">{name}</h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-zinc-500">{description}</p>
              <Link className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-zinc-950 transition group-hover:text-amber-800" href={editorPath}>
                <PencilLine aria-hidden="true" size={15} />
                Edit page
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
