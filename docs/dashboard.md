# Main admin dashboard

The `/admin` dashboard uses one page with a sticky tab bar, inspired by Trendy's metric cards while retaining N7's admin theme. Tabs are Sales, Orders, Products, Customers, Traffic, Meta ads and Operations. No live-view globe, separate dashboard subpage routes, catalogue export, migration or new runtime service is added.

## Navigation and charts

- The active tab and shared date/origin filters are encoded in `/admin` query parameters. Switching tabs uses client-side navigation. Period toggle buttons and order-origin changes apply automatically using URL replacement; Custom reveals inline date fields and applies a complete valid pair after 600 ms. No Apply button is needed. Refresh retains the report selection. Only the selected tab is rendered, with a section loading state and safe report error state.
- Each section has one home: sales figures in Sales; order state and recent orders in Orders; rankings and collection performance in Products; buyer cohorts and shipping destinations in Customers; paid traffic and delivery health in Traffic; attributed ad results and campaigns in Meta ads; current fulfilment/stock tasks in Operations. The redundant Stock to review list is removed.
- Metric cards include real daily sparklines with hover, touch and arrow-key inspection. Expanded time-series charts include selectable metrics, preceding-period comparisons and accessible data tables. Donuts and bars expose values on focus/hover and in their legends. Colors distinguish measures; change indicators respect whether higher/lower is favorable, with neutral treatment for spend and discounts.

## Store figures

- Owner and manager accounts see store performance and Meta reports. Fulfilment staff see operational counts and stock only; no Meta requests run for that role.
- Preset or custom ranges use Europe/London calendar dates, converted to UTC boundaries without requiring MySQL timezone tables. Custom ranges are limited to 366 days. Comparisons use the immediately preceding equal number of calendar days; today remains a partial day.
- LIVE selects new website orders with an explicitly live Stripe checkout. LEGACY selects imports; ALL combines those populations. Stripe test orders are excluded throughout, including operational counts. GBP-only financial summaries do not silently combine currencies.
- Paid orders, average paid order and paid order value use the original `paid_at`, falling back to `placed_at` for imports without a payment date. Refunded orders remain in their original sale cohort. Paid order value includes delivery and tax after discounts and before refunds.
- Net receipts use successful payment records less successful refunds. Charges use the original order payment date because webhook retries can update payment processing timestamps. Refunds use their own processed date. A refund of an earlier order affects the current cash period. Fees and costs are not deducted; net receipts are not profit.
- The top-products list uses discounted item values for paid orders, excluding imported child bundle lines to prevent duplicate units/value. Bundle links open the bundle editor. Recent orders instead follow placement date and can include unpaid orders.
- Sales by collection sits beside top-selling products on wide screens and uses the same paid-item, GBP, date and origin rules. It ranks the top five current collection assignments; products without assignments are grouped separately. A product assigned to multiple collections contributes once to each collection. The card explains that collection values overlap and must not be summed as store revenue.
- Current fulfilment and stock counts ignore the date range. The order-origin selection applies to fulfilment. Low stock covers active standard variants of active inventory-tracked products; out-of-stock is a subset. Bundle capacity and unrelated products without inventory tracking are not misrepresented as physical stock warnings.
- Clicking any Needs attention card expands or collapses all three together. Equal-height detail lists scroll independently, respect reduced motion and remain inaccessible to keyboard focus while collapsed. Details show up to 100 matching records (oldest orders / lowest stock first), with an explicit shown/total note when capped. Counts and details use the same database snapshot and eligibility filters.
- Dashboard product names include their real product code when available, including top sellers and expanded stock lists. Products without codes display only their name.
- Order-tab counts use placement date and all currencies, with each order's current status. These are not status-change events. Sales and product reports use original payment date and GBP; the labels distinguish these cohorts.
- Purchasing customers are deduplicated by normalized order email, then customer ID (isolated order ID if neither exists). First-purchase history includes live website orders and imports, excluding Stripe tests. A returning buyer first purchased before the period start; new buyers first purchased within it. Period totals count distinct buyers and never sum daily unique counts. Incomplete imported history can affect these classifications. Shipping destinations use paid GBP order addresses, not inferred visitor locations.
- Store figures refresh every minute while the tab is visible and the filters are not being edited. Auto-refresh can be paused. Missing visitor/session analytics are disclosed, not inferred from Meta events or ad clicks.

All time covers the selected origin’s earliest real order/payment through today, without the 366-day custom-range cap. It has no previous-period percentage or comparison line. An empty store starts today. Invalid or incomplete custom dates remain editable without loading a fallback report. Auto-refresh pauses while filters are being edited.

## Meta reports

The server reads account metadata, account-level Insights totals, daily series, campaign totals, platform delivery and device delivery. Bounded periods include equal preceding-period comparisons. All time requests Meta’s `date_preset=maximum`, then uses the returned `date_start`/`date_stop` for detailed reports, displaying that coverage and the platform’s history limitation; no previous-period requests are made. An empty maximum report produces no invented daily timeline. Secrets stay on the server and are sent in authorization headers. Responses are cached in a bounded per-process cache for one minute, keyed by dates and the configuration revision. Concurrent requests share the same promise. Each server process has its own cache. Updating credentials or the account invalidates the matching cache key.

Meta pagination reuses the trusted account path and opaque cursor, never an upstream `next` URL containing credentials. Reports are capped at ten pages; excess, malformed or looping responses are unavailable rather than shown as complete. A failed detailed endpoint does not erase valid account totals. Missing dates become zero only after a complete successful daily report; missing detail reports never become flat zero charts.

The API reports in the account's own currency and timezone, both shown in the interface. Attribution is explicitly 7-day click / 1-day view, with conversion-date reporting. Only `offsite_conversion.fb_pixel_purchase` is selected for website purchases and values; overlapping aggregate purchase aliases are not summed. Reach is fetched as a whole-period estimate, never summed across days. ROAS is attributed website value divided by spend, not profit. Zero denominators display an em dash.

A successful empty Insights response means no reported activity. Missing configuration, a paused connection, malformed responses, expired tokens, permission errors and outages display an unavailable state with no invented zeros. Store order totals remain independent and usable. Meta may delay/revise results; refreshing N7 cannot make upstream attribution real-time. Dashboard reports do not prove Pixel/CAPI deduplication or event match quality.

Traffic metrics are explicitly paid Meta traffic: impressions, reach, link clicks, CTR, landing page views, CPC and delivery-platform/device breakdowns. Website sessions, bounce rate, organic referrals, landing-page rankings and session-conversion rate are not collected by the current integration and are disclosed as unavailable. These are never inferred from Meta clicks. Website actions are ad-attributed event counts, not a sequential visitor funnel.

The Traffic tab also shows acknowledged live server-event deliveries for the currently configured pixel, excluding Test Events. Queue metadata retention is only 30 days, so older periods are incomplete. These operational counts are not visitor counts or deduplicated purchase totals.

Fields and report modes were checked against Meta's official SDK on 2026-09-30:
- https://github.com/facebook/facebook-nodejs-business-sdk/blob/main/src/objects/ad-account.js
- https://github.com/facebook/facebook-nodejs-business-sdk/blob/main/src/objects/ads-insights.js

## Consent

The affirmative button now reads **Allow all**. Essential basket, checkout and preference storage work independently. Meta advertising cookies and CAPI remain gated by marketing consent; **Essential only** does not enable them. The privacy-policy wording matches the button. UK ICO guidance states advertising storage/access technologies are not strictly necessary: https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/how-do-the-rules-apply-to-online-advertising/

## Verification

- `pnpm test:unit`: dates including UK daylight-saving transitions, financial aggregates, attribution alias deduplication, malformed/empty Meta responses and request parameters.
- `pnpm dashboard:verify-flow`: disposable local database, real SQL queries and mocked Meta requests. Checks source isolation, refunded and unpaid orders, test-mode exclusion, currency separation, payment replay dates, inventory, customer cohorts, per-day deduplication, collection overlaps, daily Meta results, cache invalidation, partial detail failures and permission failures. No live requests, payments or emails.
- `pnpm typecheck`, `pnpm lint`, `pnpm build:deploy`.

The UI was not browser-tested, following the project's current-task permission rule. Live ad-account access still depends on credentials saved in the deployed environment.
