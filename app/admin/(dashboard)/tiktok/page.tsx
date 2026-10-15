import { requireAdministrator } from "@/lib/auth/session";
import { selectOne } from "@/lib/db/query";
import { getTikTokSettings, tiktokPixelReady, tiktokServerReady } from "@/lib/tiktok/settings";
import { getTikTokDeliveryStatus } from "@/lib/tiktok/diagnostics";
import PageHeader from "@/components/admin/PageHeader";
import TikTokSettingsForm from "@/components/admin/TikTokSettingsForm";
import TikTokSetupGuide from "@/components/admin/TikTokSetupGuide";
import TikTokDeliveryStatus from "@/components/admin/TikTokDeliveryStatus";
import TikTokConnectionSection from "@/components/admin/TikTokConnectionSection";
import { z } from "zod";
export default async function TikTokSettingsPage() {
  const admin = await requireAdministrator(["OWNER", "MANAGER"]);
  const s = await getTikTokSettings();
  const [status, check] = await Promise.all([getTikTokDeliveryStatus(), selectOne("SELECT value_json FROM site_settings WHERE setting_key = 'tiktok.check'")]);
  const result = z.object({ message: z.string() }).safeParse(typeof check?.value_json === "string" ? JSON.parse(check.value_json) : check?.value_json);
  return <div className="min-w-0 space-y-6">
    <PageHeader eyebrow="Integrations" title="TikTok integration" description="Connect consented browser and server events with verified purchases and shared event IDs." />
    <p className="text-sm leading-6 text-zinc-700">Browser events: {tiktokPixelReady(s) ? s.testEventCode ? "paused during server test mode" : "configured" : "not configured or paused"}. Events API: {tiktokServerReady(s) ? "configured — verify receipt below" : "needs an enabled connection, Pixel ID and access token"}.</p>
    {s.testEventCode ? <p role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>Server test mode is active.</strong> Events use TikTok’s Test Events tool and browser events are paused. Clear the Test Events code before live advertising.</p> : null}
    <TikTokSettingsForm canEdit={admin.role === "OWNER"} values={{ pixelId: s.pixelId, pixelEnabled: s.pixelEnabled, serverEnabled: s.serverEnabled, testEventCode: s.testEventCode, revision: s.revision, hasAccessToken: Boolean(s.accessTokenEncrypted) }} />
    <TikTokConnectionSection disabled={admin.role !== "OWNER" || !tiktokServerReady(s) || !s.testEventCode} lastResult={result.success ? result.data.message : null} />
    <TikTokDeliveryStatus initial={status} canEdit={admin.role === "OWNER"} />
    <TikTokSetupGuide />
  </div>;
}
