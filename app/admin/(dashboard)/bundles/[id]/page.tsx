import { notFound } from "next/navigation";
import BundleForm from "@/components/admin/BundleForm";
import PageHeader from "@/components/admin/PageHeader";
import { getBundleForEdit, getBundleProductOptions } from "@/lib/admin/bundles";
import { isDatabaseId } from "@/lib/admin/form";
import { updateBundleAction } from "../actions";

export default async function EditBundlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isDatabaseId(id)) notFound();
  const [bundle, products] = await Promise.all([getBundleForEdit(id), getBundleProductOptions()]);
  if (!bundle) notFound();
  return (
    <div>
      <PageHeader eyebrow="Catalog" title={`Edit ${bundle.name}`} description="Update the bundle, included products, media, pricing, and storefront status." />
      <BundleForm action={updateBundleAction.bind(null, bundle.id)} bundle={bundle} products={products} />
    </div>
  );
}
