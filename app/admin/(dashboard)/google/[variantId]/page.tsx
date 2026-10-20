import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/admin/PageHeader";
import Notice from "@/components/admin/Notice";
import MerchantProductForm from "@/components/admin/google/MerchantProductForm";
import { isDatabaseId } from "@/lib/admin/form";
import { getMerchantEditor } from "@/lib/google-merchant/admin";
import { saveMerchantProductAction } from "../actions";
import { requireAdministrator } from "@/lib/auth/session";

export default async function MerchantProductPage({ params, searchParams }: { params: Promise<{ variantId: string }>; searchParams: Promise<{ saved?: string }> }) {
  await requireAdministrator(["OWNER", "MANAGER"]);
  const { variantId } = await params;
  if (!isDatabaseId(variantId)) notFound();
  const [editor, query] = await Promise.all([getMerchantEditor(variantId), searchParams]);
  if (!editor) notFound();
  return <div>
    <PageHeader eyebrow="Google Merchant catalogue" title={editor.name} description={`Product ID: n7_variant_${editor.variantId}`} actions={<Link className="inline-flex min-h-12 items-center rounded-lg border border-zinc-300 bg-white px-4 text-sm font-medium hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700" href={`/admin/${editor.productType === "BUNDLE" ? "bundles" : "products"}/${editor.productId}`}>Edit storefront product</Link>} />
    {query.saved === "1" ? <div className="mt-4"><Notice type="success">Google product details saved. The feed uses these details on its next request.</Notice></div> : null}
    {editor.status !== "ACTIVE" ? <p className="mt-4 text-sm text-zinc-600">This product is {editor.status.toLowerCase()} and is omitted from the published feed.</p> : null}
    <MerchantProductForm action={saveMerchantProductAction.bind(null, variantId)} editor={editor} key={editor.revision} />
  </div>;
}
