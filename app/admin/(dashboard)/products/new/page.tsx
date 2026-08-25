import Notice from "@/components/admin/Notice";
import PageHeader from "@/components/admin/PageHeader";
import ProductForm from "@/components/admin/ProductForm";
import { productListReturnTo } from "@/lib/admin/product-navigation";
import { getCatalogOptions } from "@/lib/admin/products";
import { createProductAction } from "../actions";

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ error?: string; returnTo?: string }> }) {
  const { error, returnTo: requestedReturnTo } = await searchParams;
  const returnTo = productListReturnTo(requestedReturnTo);
  const options = await getCatalogOptions();
  const action = createProductAction.bind(null, returnTo);
  return <div><PageHeader eyebrow="Catalog" title="Add product" description="Create a product and its default sellable variant." />{error ? <Notice>{error === "duplicate" ? "A generated product identifier is already in use." : "Check the required fields and values."}</Notice> : null}<ProductForm {...options} action={action} returnTo={returnTo} /></div>;
}
