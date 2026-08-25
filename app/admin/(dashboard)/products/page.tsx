import Link from "next/link";
import { Eye, Pencil, Plus } from "lucide-react";
import AdminThumbnail from "@/components/admin/AdminThumbnail";
import AdminMutationForm from "@/components/admin/AdminMutationForm";
import ArchiveProductButton from "@/components/admin/ArchiveProductButton";
import PageHeader from "@/components/admin/PageHeader";
import Pagination, { parsePage } from "@/components/admin/Pagination";
import ProductFiltersToolbar from "@/components/admin/ProductFiltersToolbar";
import StatusBadge from "@/components/admin/StatusBadge";
import { hasActiveProductFilters, parseProductListFilters, productListFilterQuery } from "@/lib/admin/product-list-filters";
import { productFormPath, productListPath, type ProductListSearchParams } from "@/lib/admin/product-navigation";
import { getProductListFilterOptions, listProducts } from "@/lib/admin/products";
import { archiveProductAction } from "./actions";

interface ProductsPageProps { searchParams: Promise<ProductListSearchParams> }

function formatMoney(pence: number | null): string {
  if (pence === null) return "—";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
}

function formatProductDetail(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (character) => character.toUpperCase());
}

function CatalogAssignments({ value, emptyLabel }: { value: string | null; emptyLabel: string }) {
  const assignments = value?.split("|||").filter(Boolean) ?? [];
  if (!assignments.length) return <span className="text-xs text-zinc-400">{emptyLabel}</span>;

  const visibleAssignments = assignments.slice(0, 2);
  const remainingCount = assignments.length - visibleAssignments.length;

  return (
    <div className="flex min-w-36 max-w-52 flex-wrap gap-1.5">
      {visibleAssignments.map((assignment) => (
        <span key={assignment} className="max-w-40 truncate rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700" title={assignment}>
          {assignment}
        </span>
      ))}
      {remainingCount > 0 ? (
        <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500" title={assignments.slice(2).join(", ")}>
          +{remainingCount}
        </span>
      ) : null}
    </div>
  );
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const query = await searchParams;
  const filters = parseProductListFilters(query);
  const rawPage = Array.isArray(query.page) ? query.page[0] : query.page;
  const [result, filterOptions] = await Promise.all([
    listProducts(filters, parsePage(rawPage)),
    getProductListFilterOptions(),
  ]);
  const returnTo = productListPath(query);
  const addProductPath = productFormPath("/admin/products/new", returnTo);

  return (
    <div>
      <PageHeader eyebrow="Catalog" title="Products" description="Manage product details, pricing, inventory, images, and storefront visibility." actions={<Link className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800" href={addProductPath}><Plus size={16} />Add product</Link>} />
      <ProductFiltersToolbar categories={filterOptions.categories} collections={filterOptions.collections} initialFilters={filters} resultCount={result.totalItems} />
      <div className="mt-5 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1180px] w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Categories</th>
                <th className="px-4 py-3 font-medium">Collections</th>
                <th className="px-4 py-3 font-medium">Details</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {result.products.map((product) => (
                <tr key={product.id} className="hover:bg-zinc-50/70">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <AdminThumbnail alt={product.name} src={product.image_url} />
                      <div className="min-w-0">
                        <Link className="block max-w-60 truncate font-medium text-zinc-950 hover:text-amber-700" href={productFormPath(`/admin/products/${product.id}`, returnTo)}>{product.name}</Link>
                        <p className="mt-0.5 max-w-60 truncate text-xs text-zinc-500">{product.brand ?? "Brand not set"}</p>
                        {product.inspired_by ? <p className="mt-0.5 max-w-60 truncate text-xs text-zinc-400">Inspired by {product.inspired_by}</p> : null}
                        {product.featured ? <span className="mt-1.5 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">Featured</span> : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><CatalogAssignments emptyLabel="No category" value={product.category_names} /></td>
                  <td className="px-4 py-3"><CatalogAssignments emptyLabel="No collection" value={product.collection_names} /></td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <p className="font-medium text-zinc-700">{formatProductDetail(product.product_type)}</p>
                      <p className="text-xs text-zinc-500">{formatProductDetail(product.audience)}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={product.status} /></td>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{formatMoney(product.price_pence)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{product.stock_on_hand ?? "—"}</td>
                  <td className="px-4 py-3"><div className="flex items-center justify-end gap-1"><Link aria-label={`View ${product.name} in storefront`} className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-amber-700" href={`/products/${product.slug}`} target="_blank" title="View storefront"><Eye size={16} /></Link><Link aria-label={`Edit ${product.name}`} className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950" href={productFormPath(`/admin/products/${product.id}`, returnTo)} title="Edit product"><Pencil size={16} /></Link><AdminMutationForm action={archiveProductAction.bind(null, product.id)} errorMessage="The product couldn’t be archived" loadingMessage="Archiving product…" successDescription="It is hidden from the storefront and still available in admin." successMessage="Product archived" successType="warning"><ArchiveProductButton disabled={product.status === "ARCHIVED"} name={product.name} /></AdminMutationForm></div></td>
                </tr>
              ))}
              {!result.products.length ? <tr><td className="px-4 py-12 text-center text-zinc-500" colSpan={8}>{hasActiveProductFilters(filters) ? "No products match these filters." : "No products found."}</td></tr> : null}
            </tbody>
          </table>
        </div>
        <Pagination page={result.page} pageSize={result.pageSize} pathname="/admin/products" query={productListFilterQuery(filters)} totalItems={result.totalItems} />
      </div>
    </div>
  );
}
