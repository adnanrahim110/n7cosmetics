import { catalogReady, getMetaCatalogSettings } from "@/lib/meta/catalog-settings";
import { getMetaCatalogSummary } from "@/lib/meta/catalog-status";
import MetaCatalogSettingsForm from "./MetaCatalogSettingsForm";
import MetaCatalogControl from "./MetaCatalogControl";
import MetaCatalogStatus from "./MetaCatalogStatus";

export default async function MetaCatalogSection({ canEdit }: { canEdit: boolean }) {
  const [settings, summary] = await Promise.all([getMetaCatalogSettings(), getMetaCatalogSummary()]);
  return <section id="catalogue" aria-labelledby="meta-catalogue-title" className="space-y-5 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
    <header><h2 id="meta-catalogue-title" className="font-body text-lg font-semibold text-zinc-950">Automatic product catalogue</h2><p className="mt-2 text-sm leading-6 text-zinc-500">Keep Meta’s catalogue aligned with N7’s published products, prices, images and available stock. This connection works independently of Pixel, Conversions API and reporting.</p></header>
    <MetaCatalogSettingsForm canEdit={canEdit} values={{ catalogId: settings.catalogId, enabled: settings.enabled, hasToken: Boolean(settings.tokenEncrypted), revision: settings.revision }} />
    <div className="grid gap-4 sm:grid-cols-2"><MetaCatalogControl kind="check" disabled={!canEdit || !catalogReady(settings)} /><MetaCatalogControl kind="sync" disabled={!canEdit || !catalogReady(settings)} /></div>
    <MetaCatalogStatus key={`${settings.revision}:${summary.lastScan}:${summary.lastSuccess}`} initial={summary} />
  </section>;
}
