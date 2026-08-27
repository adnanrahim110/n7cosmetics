import BundleForm from "@/components/admin/BundleForm";
import PageHeader from "@/components/admin/PageHeader";
import { getBundleProductOptions } from "@/lib/admin/bundles";
import { createBundleAction } from "../actions";

export default async function NewBundlePage() {
  const products = await getBundleProductOptions();
  return (
    <div>
      <PageHeader eyebrow="Catalog" title="Add bundle" description="Create a curated bundle from existing products. Its storefront URL is generated automatically from the title." />
      <BundleForm action={createBundleAction} products={products} />
    </div>
  );
}
