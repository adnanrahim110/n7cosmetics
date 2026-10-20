import Link from "next/link";

export default function MerchantProductLink({ variantId }: { variantId: string | null }) {
  return variantId ? <Link className="inline-flex min-h-12 items-center rounded-lg border border-zinc-300 bg-white px-4 text-sm font-medium hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700" href={`/admin/google/${variantId}`}>Google product details</Link> : null;
}
