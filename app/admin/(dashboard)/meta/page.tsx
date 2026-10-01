import MetaSettingsForm, {
  MetaConnectionCheck,
} from "@/components/admin/MetaSettingsForm";
import PageHeader from "@/components/admin/PageHeader";
import MetaDeliveryHealth from "@/components/admin/MetaDeliveryHealth";
import { requireAdministrator } from "@/lib/auth/session";
import { selectRows } from "@/lib/db/query";
import {
  capiReady,
  getMetaSettings,
  pixelReady,
  reportingReady,
} from "@/lib/meta/settings";
import { META_API_VERSION } from "@/lib/meta/shared";
import {
  Cable,
  CheckCircle2,
  CircleDashed,
  Radio,
  ShieldCheck,
} from "lucide-react";
import type { RowDataPacket } from "mysql2/promise";

const card = "rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6";
const docs = "text-amber-800 underline underline-offset-4";
export default async function MetaSettingsPage() {
  const admin = await requireAdministrator(["OWNER", "MANAGER"]);
  const s = await getMetaSettings();
  const [jobs, checks, totals] = await Promise.all([
    selectRows<RowDataPacket>(
      "SELECT event_name, status, attempts, test_event_code, last_error, created_at, sent_at FROM meta_event_jobs ORDER BY id DESC LIMIT 12",
    ),
    selectRows<RowDataPacket>(
      "SELECT setting_key, value_json FROM site_settings WHERE setting_key LIKE 'meta.check.%'",
    ),
    selectRows<RowDataPacket>(
      "SELECT status, COUNT(*) AS total FROM meta_event_jobs WHERE created_at > DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 24 HOUR) GROUP BY status",
    ),
  ]);
  const canEdit = admin.role === "OWNER";
  const statuses = [
    {
      label: "Meta Pixel",
      enabled: pixelReady(s),
      icon: Radio,
      hint: pixelReady(s)
        ? "Configured · starts after consent"
        : s.pixelEnabled
          ? "Add a Pixel / dataset ID"
          : "Paused",
    },
    {
      label: "Conversions API",
      enabled: capiReady(s),
      icon: Cable,
      hint: capiReady(s)
        ? s.testEventCode
          ? "Configured · server test mode"
          : "Configured · live server events"
        : s.capiEnabled
          ? "Needs a dataset ID and token"
          : "Paused",
    },
    {
      label: "Ad account reporting",
      enabled: reportingReady(s),
      icon: ShieldCheck,
      hint: reportingReady(s)
        ? "Configured · verify access below"
        : s.reportingEnabled
          ? "Needs an ad account ID and token"
          : "Paused",
    },
  ];
  const date = (value: unknown) =>
    value
      ? new Intl.DateTimeFormat("en-GB", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "UTC",
        }).format(new Date(String(value))) + " UTC"
      : "—";
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Integrations"
        title="Meta integration"
        description="Connect N7’s website activity to Meta and prepare your advertising reporting. Configure each feature independently."
      />
      {s.testEventCode ? <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm leading-6 text-amber-950"><strong>Server test mode is active.</strong> Purchases are sent as test events and do not count as live campaign conversions. Clear the Test Events code and save settings before accepting live orders.</div> : null}
      <div className="grid gap-4 lg:grid-cols-3">
        {statuses.map(({ label, enabled, icon: Icon, hint }) => (
          <section key={label} className={card}>
            <div className="flex items-center justify-between">
              <Icon className="text-amber-800" size={21} />
              {enabled ? (
                <CheckCircle2 size={17} className="text-emerald-700" />
              ) : (
                <CircleDashed size={17} className="text-zinc-400" />
              )}
            </div>
            <h2 className="mt-4 font-body text-sm font-semibold text-zinc-950">
              {label}
            </h2>
            <p className="mt-1 text-xs leading-5 text-zinc-500">{hint}</p>
          </section>
        ))}
      </div>
      <MetaSettingsForm
        canEdit={canEdit}
        values={{
          pixelId: s.pixelId,
          pixelEnabled: s.pixelEnabled,
          capiEnabled: s.capiEnabled,
          adAccountId: s.adAccountId,
          reportingEnabled: s.reportingEnabled,
          testEventCode: s.testEventCode,
          revision: s.revision,
          hasCapiToken: Boolean(s.capiTokenEncrypted),
          hasReportingToken: Boolean(s.reportingTokenEncrypted),
        }}
      />
      <MetaDeliveryHealth />
      <section className={card}>
        <h2 className="font-body text-base font-semibold text-zinc-950">
          Connection checks
        </h2>
        <p className="mt-1 text-sm leading-6 text-zinc-500">
          Save your settings before testing. A saved ID is configuration, not
          proof that Meta has received events.
        </p>
        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          {(["capi", "reporting"] as const).map((kind) => {
            const raw = checks.find(
              (row) => row.setting_key === `meta.check.${kind}`,
            )?.value_json;
            const result = raw
              ? typeof raw === "string"
                ? JSON.parse(raw)
                : raw
              : null;
            return (
              <div key={kind} className="space-y-3">
                <h3 className="text-sm font-semibold text-zinc-800">
                  {kind === "capi"
                    ? "Server event delivery"
                    : "Ad account permissions"}
                </h3>
                <MetaConnectionCheck kind={kind} disabled={!canEdit} />
                {result ? (
                  <p
                    className={`text-xs leading-5 ${result.success ? "text-emerald-800" : "text-red-800"}`}
                  >
                    {result.message}
                    <span className="mt-1 block text-zinc-500">
                      Last checked: {date(result.checkedAt)}
                    </span>
                  </p>
                ) : (
                  <p className="text-xs text-zinc-500">
                    No check recorded for these settings.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
      <section className={card}>
        <h2 className="font-body text-base font-semibold text-zinc-950">
          Server event delivery
        </h2>
        <p className="mt-1 text-sm leading-6 text-zinc-500">
          Local delivery records, not Meta conversion or attribution totals.
          Meta’s reporting may update later.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {["PENDING", "PROCESSING", "SENT", "FAILED", "CANCELLED"].map(
            (status) => (
              <span
                key={status}
                className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs text-zinc-700"
              >
                {status === "SENT"
                  ? "Accepted by Meta"
                  : status.charAt(0) + status.slice(1).toLowerCase()}
                :{" "}
                {Number(
                  totals.find((row) => row.status === status)?.total ?? 0,
                )}
              </span>
            ),
          )}
        </div>
        <p className="mt-2 text-xs text-zinc-400">
          Events created in the last 24 hours. Includes server test events from
          the storefront.
        </p>
        {jobs.length ? (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs text-zinc-500">
                <tr>
                  {[
                    "Event",
                    "Mode",
                    "Delivery",
                    "Attempts",
                    "Created",
                    "Details",
                  ].map((title) => (
                    <th key={title} className="px-3 py-3 font-medium">
                      {title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.map((job, index) => (
                  <tr key={index} className="border-b border-zinc-100">
                    <td className="px-3 py-3 font-medium">{job.event_name}</td>
                    <td className="px-3 py-3">
                      {job.test_event_code ? "Test" : "Live"}
                    </td>
                    <td className="px-3 py-3">
                      {job.status === "SENT"
                        ? "Accepted"
                        : String(job.status).toLowerCase()}
                    </td>
                    <td className="px-3 py-3">{job.attempts}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-xs">
                      {date(job.created_at)}
                    </td>
                    <td className="max-w-sm px-3 py-3 text-xs text-zinc-500">
                      {job.last_error ||
                        (job.sent_at
                          ? `Accepted ${date(job.sent_at)}`
                          : "Awaiting delivery")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-5 rounded-lg bg-zinc-50 p-4 text-sm text-zinc-500">
            No server events yet. Configure the Conversions API and allow
            marketing cookies on the storefront to begin.
          </p>
        )}
      </section>
      <section className={card} id="setup-guide">
        <h2 className="font-body text-lg font-semibold text-zinc-950">
          Setup guide for your Meta administrator
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Use assets owned by N7’s Business Portfolio. Meta’s menu labels may
          vary with your account and access.
        </p>
        <ol className="mt-6 space-y-6 text-sm leading-6 text-zinc-600">
          <li>
            <h3 className="font-semibold text-zinc-950">
              1. Find or create the web dataset
            </h3>
            <p>
              Open{" "}
              <a
                className={docs}
                href="https://business.facebook.com/events_manager2/"
                target="_blank"
                rel="noreferrer"
              >
                Events Manager
              </a>
              , select N7’s data source, then Settings. Copy its Pixel / dataset
              ID. If none exists, use Connect data → Web and create a
              dataset/Pixel. Save the ID above to enable browser tracking after
              visitor consent.
            </p>
          </li>
          <li>
            <h3 className="font-semibold text-zinc-950">
              2. Generate the Conversions API token
            </h3>
            <p>
              In that same dataset’s Settings, find Conversions API → Set up
              manually / direct integration → Generate access token. Paste it
              into the Conversions API field. You need permission to manage the
              dataset. This token does not automatically grant access to
              advertising reports.
            </p>
          </li>
          <li>
            <h3 className="font-semibold text-zinc-950">
              3. Check events before going live
            </h3>
            <p>
              Open the dataset’s Test events tab, copy the server Test Events
              code, save it here, then select Send server test event. Check
              Meta’s event details and Diagnostics. For a full storefront check,
              allow marketing cookies and view a product, add it to the basket,
              start checkout and complete a Stripe test payment. Remove the code
              when finished. The code applies to server events; browser events
              still use the configured Pixel.
            </p>
          </li>
          <li>
            <h3 className="font-semibold text-zinc-950">
              4. Connect the ad account separately
            </h3>
            <p>
              Find the ad account ID in{" "}
              <a
                className={docs}
                href="https://adsmanager.facebook.com/"
                target="_blank"
                rel="noreferrer"
              >
                Ads Manager
              </a>{" "}
              or Business settings → Accounts → Ad accounts. For ongoing
              reporting, create/use a Meta developer app with Marketing API
              access and a system user in Business settings → Users → System
              users. Assign the app and N7’s ad account, then generate a token
              with <code>ads_read</code>. Depending on app ownership and asset
              access, Meta may require verification or App Review. Save it above
              and run Check reporting access. Replace revoked or expired tokens
              here.
            </p>
          </li>
          <li>
            <h3 className="font-semibold text-zinc-950">
              5. Check the domain and event quality
            </h3>
            <p>
              Use N7’s live HTTPS domain, verify it in Business settings if Meta
              requests it, and review dataset traffic permissions. Avoid adding
              a second copy of the Pixel through another tool. Browser and
              server copies share the same event name and ID. Purchases use paid
              order totals in GBP, including delivery and tax, after discounts.
              Customer email and phone are normalised and SHA-256 hashed on the
              server. Marketing consent is separate from email subscriptions.
            </p>
          </li>
          <li>
            <h3 className="font-semibold text-zinc-950">
              6. Keep product IDs consistent
            </h3>
            <p>
              Events use <code>n7_variant_&lt;variant ID&gt;</code>, including
              the purchasable bundle variant. The future catalogue export will
              use those same IDs. The main dashboard shows store and advertising
              performance; detailed dashboard pages and catalogue export will follow.
            </p>
          </li>
        </ol>
        <div className="mt-6 border-t border-zinc-200 pt-5 text-xs leading-6 text-zinc-500">
          <p>
            Implementation uses Meta Graph API {META_API_VERSION}. Retries keep
            the original event ID and time. Unsent events expire before the
            48-hour browser/server deduplication window; local delivery records
            are retained for 30 days. A background Meta worker must run on the
            server.
          </p>
          <p className="mt-2">
            <a
              className={docs}
              href="https://developers.facebook.com/docs/marketing-api/conversions-api/best-practices/"
              target="_blank"
              rel="noreferrer"
            >
              Meta best practices
            </a>{" "}
            ·{" "}
            <a
              className={docs}
              href="https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events/"
              target="_blank"
              rel="noreferrer"
            >
              Event deduplication
            </a>{" "}
            ·{" "}
            <a
              className={docs}
              href="https://developers.facebook.com/docs/marketing-api/insights/"
              target="_blank"
              rel="noreferrer"
            >
              Reporting permissions and Insights
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
