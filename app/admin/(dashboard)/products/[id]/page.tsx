import { notFound } from "next/navigation";
import Notice from "@/components/admin/Notice";
import PageHeader from "@/components/admin/PageHeader";
import ProductForm from "@/components/admin/ProductForm";
import { productListReturnTo } from "@/lib/admin/product-navigation";
import { getCatalogOptions, getProductForEdit } from "@/lib/admin/products";
import { isDatabaseId } from "@/lib/admin/form";
import { updateProductAction } from "../actions";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string; returnTo?: string }>;
}

export default async function EditProductPage({ params, searchParams }: EditProductPageProps) {
  const { id } = await params;
  if (!isDatabaseId(id)) notFound();
  const [product, options, query] = await Promise.all([getProductForEdit(id), getCatalogOptions(), searchParams]);
  if (!product) notFound();
  const returnTo = productListReturnTo(query.returnTo);
  const action = updateProductAction.bind(null, id, returnTo);
  return <div><PageHeader eyebrow="Catalog" title={product.name} description="Edit storefront content, pricing, and stock." />{query.saved ? <Notice type="success">Product saved.</Notice> : null}{query.error ? <Notice>{query.error === "duplicate" ? "A generated product identifier is already in use." : "Check the required fields and values."}</Notice> : null}<ProductForm product={product} {...options} action={action} returnTo={returnTo} /></div>;
}
