import Link from "next/link";
import PageHeader from "@/components/admin/PageHeader";
import Notice from "@/components/admin/Notice";
import MerchantSetupSection from "@/components/admin/google/MerchantSetupSection";
import MerchantSummarySection from "@/components/admin/google/MerchantSummarySection";
import MerchantCatalogSection from "@/components/admin/google/MerchantCatalogSection";
import { getMerchantSnapshot, type MerchantSnapshot } from "@/lib/google-merchant/data";
import { merchantFilters, type MerchantSearchParams } from "@/lib/google-merchant/filters";
import { requireAdministrator } from "@/lib/auth/session";

export default async function GoogleMerchantPage({ searchParams }: { searchParams: Promise<MerchantSearchParams> }) {
  await requireAdministrator(["OWNER", "MANAGER"]);
  const filters = merchantFilters(await searchParams);
  let snapshot: MerchantSnapshot | null = null;
  try { snapshot = await getMerchantSnapshot(); } catch { /* Render a recoverable admin state without database details. */ }
  return <div>
    <PageHeader eyebrow="Marketing" title="Google Merchant catalogue" description="Current product data, feed readiness and the details Google needs." actions={<Link className="inline-flex min-h-12 items-center rounded-lg border border-zinc-300 bg-white px-4 text-sm font-medium hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700" href="/admin/google">Refresh catalogue</Link>} />
    {snapshot ? <>
      <MerchantSetupSection error={snapshot.configurationError} origin={snapshot.origin} />
      <MerchantSummarySection configurationError={snapshot.configurationError} entries={snapshot.entries} />
      <MerchantCatalogSection configurationError={Boolean(snapshot.configurationError)} entries={snapshot.entries} {...filters} />
    </> : <div className="mt-6"><Notice>The catalogue could not be read. Check the database connection and apply migrations 036–037, then refresh this page. The feed returns a temporary error while catalogue reads fail.</Notice></div>}
  </div>;
}
