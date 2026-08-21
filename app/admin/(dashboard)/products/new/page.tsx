import Notice from "@/components/admin/Notice";
import PageHeader from "@/components/admin/PageHeader";
import ProductForm from "@/components/admin/ProductForm";
import { getCatalogOptions } from "@/lib/admin/products";
import { createProductAction } from "../actions";

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const options = await getCatalogOptions();
  return <div><PageHeader eyebrow="Catalog" title="Add product" description="Create a product and its default sellable variant." />{error ? <Notice>{error === "duplicate" ? "That slug or SKU is already in use." : "Check the required fields and values."}</Notice> : null}<ProductForm {...options} action={createProductAction} /></div>;
}
