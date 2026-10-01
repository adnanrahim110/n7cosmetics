import "./load-env";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import mysql from "mysql2/promise";
import { getDatabaseConfig } from "../lib/env";
import { executeMutation } from "../lib/db/query";
import {
  getDashboardOperations,
  getStoreDashboard,
  getDashboardRange,
} from "../lib/admin/dashboard";
import { dashboardRange } from "../lib/admin/dashboard-dates";
import { defaultMetaSettings } from "../lib/meta/settings";
import { encryptSecret } from "../lib/security/encryption";
import { fetchMetaOverview, getMetaOverview } from "../lib/meta/insights";
import {
  getCustomerAnalytics,
  getOrderAnalytics,
  getProductAnalytics,
  getTrackingHealth,
  getMetaMatchingReport,
} from "../lib/admin/dashboard-reports";

async function run() {
  const config = getDatabaseConfig();
  assert.ok(
    ["127.0.0.1", "localhost", "::1"].includes(config.host),
    "Checks require a local database",
  );
  const database = `n7_dashboard_test_${Date.now()}`;
  assert.match(database, /^n7_dashboard_test_\d+$/);
  const options = {
    host: config.host,
    port: config.port,
    user: process.env.DB_ROOT_PASSWORD ? "root" : config.user,
    password: process.env.DB_ROOT_PASSWORD || config.password,
  };
  const setup = await mysql.createConnection({
    ...options,
    multipleStatements: true,
  });
  const originalFetch = globalThis.fetch;
  let created = false,
    checks = 0,
    calls = 0,
    deny = false,
    denyDetails = false;
  const check = (value: unknown, message: string) => {
    assert.ok(value, message);
    checks++;
  };
  try {
    await setup.query(
      `CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    created = true;
    await setup.changeUser({ database });
    for (const file of (await readdir("database/migrations"))
      .filter((name) => name.endsWith(".sql"))
      .sort())
      await setup.query(await readFile(`database/migrations/${file}`, "utf8"));
    globalThis.n7MySqlPool = mysql.createPool({
      ...options,
      database,
      connectionLimit: 6,
      supportBigNumbers: true,
      bigNumberStrings: true,
      timezone: "Z",
    });
    const emptyHistory = await getDashboardRange(
      { range: "all" },
      new Date("2026-09-30T12:00:00Z"),
    );
    check(
      emptyHistory.days === 1 && emptyHistory.start === "2026-09-30",
      "An empty store has a valid all-time range",
    );
    globalThis.fetch = async (url, init) => {
      calls++;
      assert.ok(
        String(url).startsWith("https://graph.facebook.com/v26.0/act_"),
      );
      assert.equal(
        new Headers(init?.headers).get("authorization"),
        "Bearer fixture-token",
      );
      if (deny)
        return Response.json(
          {
            error: {
              code: 200,
              message: "Private upstream error must not appear",
            },
          },
          { status: 403 },
        );
      const params = new URL(String(url)).searchParams;
      const detail = params.get("limit") === "500";
      if (detail && denyDetails)
        return Response.json({ error: { code: 200 } }, { status: 403 });
      const since = params.has("time_range")
        ? JSON.parse(params.get("time_range")!).since
        : "";
      return String(url).includes("/insights?")
        ? Response.json({
            data: [
              {
                ...(params.get("date_preset") === "maximum"
                  ? { date_start: "2023-09-01", date_stop: "2026-09-30" }
                  : {}),
                ...(params.has("time_increment")
                  ? { date_start: since, date_stop: since }
                  : {}),
                ...(params.get("level") === "campaign"
                  ? { campaign_id: "123456", campaign_name: "Fixture campaign" }
                  : {}),
                ...(params.get("breakdowns") === "publisher_platform"
                  ? { publisher_platform: "instagram" }
                  : {}),
                ...(params.get("breakdowns") === "impression_device"
                  ? { impression_device: "mobile_app" }
                  : {}),
                spend: "25",
                impressions: "200",
                reach: "150",
                inline_link_clicks: "10",
                actions: [
                  {
                    action_type: "offsite_conversion.fb_pixel_purchase",
                    value: "2",
                  },
                ],
                action_values: [
                  {
                    action_type: "offsite_conversion.fb_pixel_purchase",
                    value: "100",
                  },
                ],
              },
            ],
          })
        : Response.json({
            name: "Fixture account",
            currency: "USD",
            timezone_name: "America/New_York",
          });
    };
    const product = await executeMutation(
      "INSERT INTO products (name,slug,status,product_code) VALUES ('Dashboard fixture','dashboard-fixture','ACTIVE',' 253 ')",
    );
    await executeMutation(
      "INSERT INTO product_variants (product_id,title,sku,price_pence,stock_on_hand) VALUES (?,'Low stock','DASH-LOW',4000,2),(?,'No stock','DASH-ZERO',4000,0)",
      [product.insertId, product.insertId],
    );
    const untracked = await executeMutation(
      "INSERT INTO products (name,slug,status,track_inventory) VALUES ('Untracked fixture','untracked-fixture','ACTIVE',0)",
    );
    await executeMutation(
      "INSERT INTO product_variants (product_id,title,sku,price_pence,stock_on_hand) VALUES (?,'Ignore','DASH-IGNORE',4000,0)",
      [untracked.insertId],
    );
    let sequence = 0;
    async function order(
      date: string,
      total: number,
      state = "PAID",
      source = "LIVE",
      mode = "live",
      currency = "GBP",
      missingPaidDate = false,
    ) {
      const record = await executeMutation(
        "INSERT INTO orders (order_number,status,payment_status,currency,customer_email,customer_name,subtotal_pence,shipping_pence,total_pence,paid_at,placed_at,source) VALUES (?,'CONFIRMED',?,?, 'fixture@example.test','Fixture',?,300,?,?,?,?)",
        [
          `DASH-${++sequence}`,
          state,
          currency,
          total - 300,
          total,
          state === "PENDING" || missingPaidDate ? null : date,
          date,
          source,
        ],
      );
      const id = String(record.insertId);
      if (source === "LIVE")
        await executeMutation(
          "INSERT INTO stripe_checkouts (order_id,request_hash,stripe_mode,expires_at) VALUES (?,?,?,'2026-10-01')",
          [id, "a".repeat(64), mode],
        );
      if (state !== "PENDING")
        await executeMutation(
          "INSERT INTO payments (order_id,provider,payment_type,status,amount_pence,currency,processed_at,created_at,source) VALUES (?,'STRIPE','CHARGE','SUCCEEDED',?,?,'2026-09-02 12:00:00',?,?)",
          [id, total, currency, date, source],
        );
      await executeMutation(
        "INSERT INTO order_items (order_id,product_id,product_name,variant_title,sku,unit_price_pence,quantity,line_total_pence) VALUES (?,?,'Dashboard fixture','100 ml','DASH',?,1,?)",
        [id, product.insertId, total - 300, total - 300],
      );
      return id;
    }
    async function refund(id: string, total: number, date: string) {
      await executeMutation(
        "INSERT INTO payments (order_id,provider,payment_type,status,amount_pence,processed_at) VALUES (?,'STRIPE','REFUND','SUCCEEDED',?,?)",
        [id, total, date],
      );
    }
    await order("2026-08-31 23:30:00", 4000);
    const partial = await order(
      "2026-09-01 12:00:00",
      6000,
      "PARTIALLY_REFUNDED",
    );
    await refund(partial, 1000, "2026-09-02 10:00:00");
    const old = await order("2026-08-30 12:00:00", 8000, "PARTIALLY_REFUNDED");
    await refund(old, 5000, "2026-09-01 10:00:00");
    const full = await order("2026-09-01 13:00:00", 2000, "REFUNDED");
    await refund(full, 2000, "2026-09-02 11:00:00");
    await order(
      "2026-09-01 12:00:00",
      2500,
      "PAID",
      "LEGACY",
      "live",
      "GBP",
      true,
    );
    await order("2026-09-01 12:00:00", 99999, "PAID", "LIVE", "test");
    await order("2026-09-01 12:00:00", 1000, "PENDING");
    await order("2026-09-01 12:00:00", 7000, "PAID", "LIVE", "live", "USD");
    const range = dashboardRange(
      { range: "custom", start: "2026-09-01", end: "2026-09-02" },
      new Date("2026-09-30T12:00:00Z"),
    );
    const data = await getStoreDashboard(range);
    const lifetime = await getDashboardRange(
      { range: "all" },
      new Date("2026-09-30T12:00:00Z"),
    );
    const lifetimeSales = await getStoreDashboard(lifetime);
    const lifetimeOrders = await getOrderAnalytics(lifetime);
    check(
      lifetime.start === "2026-08-30" &&
        lifetimeSales.current.orderValue === 20000 &&
        lifetimeSales.previousDays.length === 0 &&
        lifetimeSales.days.at(-1)?.date === lifetime.end,
      "All time includes the earliest real sales and never adds a fictitious previous period",
    );
    check(
      lifetimeOrders.current.placed === 6 &&
        lifetimeOrders.previousDays.length === 0,
      "All-time order analytics include every eligible placement without comparison buckets",
    );
    const legacyHistory = await getDashboardRange(
      { range: "all", source: "LEGACY" },
      new Date("2026-09-30T12:00:00Z"),
    );
    check(
      legacyHistory.start === "2026-09-01",
      "All-time history respects the selected order origin",
    );
    check(
      data.current.paidOrders === 3 && data.current.orderValue === 12000,
      "Test, unpaid, imported and foreign-currency sales are excluded from live GBP totals",
    );
    check(
      data.current.refunds === 8000 && data.current.netReceipts === 4000,
      "Refunds of earlier orders reduce current receipts without erasing paid orders",
    );
    check(
      data.previous.charges === 8000 && data.previous.paidOrders === 1,
      "A replayed charge timestamp does not move the original receipt into the next period",
    );
    check(
      data.days[0].paidOrders === 3,
      "BST midnight boundaries classify the 23:30 UTC purchase on the correct UK day",
    );
    check(
      data.current.averageOrder === 4000 && data.current.shipping === 900,
      "Weighted order average and order breakdown are exact",
    );
    check(
      Number(data.topProducts[0].value) === 11100 &&
        Number(data.topProducts[0].units) === 3,
      "Top product value uses discounted item totals without delivery",
    );
    check(
      data.collectionSales.length === 1 &&
        data.collectionSales[0].collection_id === null &&
        Number(data.collectionSales[0].value) === 11100 &&
        Number(data.collectionSales[0].units) === 3,
      "Unassigned collection sales use the same real paid GBP order population as top products",
    );
    const legacy = await getStoreDashboard({ ...range, source: "LEGACY" });
    check(
      legacy.current.orderValue === 2500 && legacy.current.paidOrders === 1,
      "Historical orders can use their original placed date when payment date is absent",
    );
    const all = await getStoreDashboard({ ...range, source: "ALL" });
    check(
      all.current.paidOrders === 4 && all.current.orderValue === 14500,
      "All origins combine real orders while excluding Stripe test orders",
    );
    const ops = await getDashboardOperations("LIVE");
    check(
      ops.lowStockCount === 2 && ops.outOfStock === 1,
      "Stock warnings respect inventory tracking and include out-of-stock in low stock",
    );
    check(
      ops.awaitingFulfilment === 4,
      "Operations exclude unpaid, test and fully refunded orders across all dates",
    );
    check(
      ops.awaitingOrders.length === ops.awaitingFulfilment &&
        ops.awaitingOrders[0].id === old &&
        !ops.awaitingOrders.some((order) => order.id === full),
      "Expanded awaiting orders match the count and show oldest eligible orders first",
    );
    check(
      ops.lowStock.length === ops.lowStockCount &&
        new Set(ops.lowStock.map((item) => item.variant_id)).size ===
          ops.lowStockCount,
      "Expanded stock lists include each matching variant once",
    );
    check(
      ops.outOfStockItems.length === ops.outOfStock &&
        ops.outOfStockItems.every((item) => item.stock_on_hand <= 0),
      "Out-of-stock details contain only unavailable variants",
    );
    check(
      data.topProducts[0].product_code === "253" &&
        ops.lowStock.every((item) => item.product_code === "253"),
      "Both dashboard product lists expose the trimmed real product code",
    );
    const legacyOps = await getDashboardOperations("LEGACY");
    check(
      legacyOps.awaitingFulfilment === 1 &&
        legacyOps.awaitingOrders.length === 1 &&
        legacyOps.awaitingOrders[0].source === "LEGACY",
      "Expanded fulfilment details respect the selected order origin",
    );
    const firstCollection = await executeMutation(
      "INSERT INTO collections (name,slug,status) VALUES ('First dashboard collection','dashboard-first','ACTIVE')",
    );
    const secondCollection = await executeMutation(
      "INSERT INTO collections (name,slug,status) VALUES ('Second dashboard collection','dashboard-second','ACTIVE')",
    );
    await executeMutation(
      "INSERT INTO product_collections (product_id,collection_id) VALUES (?,?),(?,?)",
      [
        product.insertId,
        firstCollection.insertId,
        product.insertId,
        secondCollection.insertId,
      ],
    );
    await executeMutation(
      `INSERT INTO order_items (order_id,parent_item_id,product_id,product_name,variant_title,sku,unit_price_pence,quantity,line_total_pence)
       SELECT order_id,id,product_id,'Child fixture','100 ml','DASH-CHILD',99999,1,99999
       FROM order_items WHERE order_id=? AND parent_item_id IS NULL LIMIT 1`,
      [partial],
    );
    const collectionData = await getStoreDashboard(range);
    check(
      collectionData.collectionSales.length === 2 &&
        collectionData.collectionSales.every(
          (collection) =>
            Number(collection.value) === 11100 &&
            Number(collection.units) === 3,
        ),
      "Multi-collection products count once per collection and imported child lines do not inflate sales",
    );
    const legacyCollections = await getStoreDashboard({
      ...range,
      source: "LEGACY",
    });
    check(
      legacyCollections.collectionSales.length === 2 &&
        legacyCollections.collectionSales.every(
          (collection) =>
            Number(collection.value) === 2200 && Number(collection.units) === 1,
        ),
      "Collection sales respect the selected historical order origin",
    );
    const orderReport = await getOrderAnalytics(range);
    check(
      orderReport.current.placed === 5 &&
        orderReport.current.paid === 4 &&
        orderReport.current.unpaid === 1,
      "Order tab includes all real currencies, unpaid orders and original placement dates",
    );
    check(
      orderReport.statuses.reduce((sum, row) => sum + Number(row.value), 0) ===
        5 && orderReport.recentOrders.length === 5,
      "Order status and recent rows reconcile with placement counts",
    );
    const productReport = await getProductAnalytics(range);
    check(
      productReport.current.units === 3 &&
        productReport.current.itemValue === 11100 &&
        Number(productReport.types[0].value) === 3,
      "Product daily totals and type mix exclude child bundle lines and non-GBP orders",
    );
    const customers = await getCustomerAnalytics(range);
    check(
      customers.current.buyers === 1 &&
        customers.current.returningBuyers === 1 &&
        customers.current.newBuyers === 0,
      "Repeat paid orders produce one buyer and use prior history for returning classification",
    );
    check(
      customers.previous.buyers === 1 &&
        customers.previous.newBuyers === 1 &&
        customers.topCustomers[0].value === 12000,
      "Previous customer cohort and current paid customer value are calculated independently",
    );
    const newBuyer = await order("2026-09-02 12:00:00", 3300);
    await executeMutation(
      "UPDATE orders SET customer_email=' NewBuyer@Example.test ',customer_name='New Buyer' WHERE id=?",
      [newBuyer],
    );
    const repeatBuyer = await order("2026-09-01 14:00:00", 4300);
    await executeMutation(
      "UPDATE orders SET customer_email='newbuyer@example.test',customer_name='New Buyer' WHERE id=?",
      [repeatBuyer],
    );
    const customerRepeat = await getCustomerAnalytics(range);
    check(
      customerRepeat.current.buyers === 2 &&
        customerRepeat.current.newBuyers === 1 &&
        customerRepeat.current.returningBuyers === 1,
      "Normalized emails merge buyers across days without summing daily unique counts",
    );
    check(
      customerRepeat.days.reduce((sum, day) => sum + day.values.buyers, 0) ===
        3,
      "Daily buyer counts can exceed distinct period buyers without inflating the period total",
    );
    const legacyCustomerReport = await getCustomerAnalytics({
      ...range,
      source: "LEGACY",
    });
    check(
      legacyCustomerReport.current.buyers === 1 &&
        legacyCustomerReport.current.returningBuyers === 1,
      "Imported buyer classification considers earlier real website purchases",
    );
    check(
      (await getMetaOverview(range)).status === "unconfigured" && calls === 0,
      "Missing Meta credentials do not cause network requests or fake zero metrics",
    );
    const settings = {
      ...defaultMetaSettings,
      adAccountId: "123456789",
      pixelId: "123456789",
      reportingTokenEncrypted: encryptSecret("fixture-token"),
    };
    await executeMutation(
      "UPDATE site_settings SET value_json=? WHERE setting_key='meta.configuration'",
      [JSON.stringify(settings)],
    );
    const report = await getMetaOverview(range);
    check(
      report.status === "ready" &&
        report.currency === "USD" &&
        report.timezone === "America/New_York",
      "Meta reports retain the ad account currency and timezone",
    );
    check(
      report.current?.roas === 4 && calls === 8,
      "Account totals, daily history, campaigns and delivery breakdowns are fetched",
    );
    check(
      report.details?.days?.length === 2 &&
        report.details.days[0].spend === 25 &&
        report.details.days[1].spend === 0 &&
        report.details.campaigns?.[0].name === "Fixture campaign" &&
        report.details.errors.length === 0,
      "Meta daily dates are filled and real campaign names are preserved",
    );
    await getMetaOverview(range);
    check(calls === 8, "Refreshing the store reuses the bounded Meta cache");
    const lifetimeMeta = await getMetaOverview(lifetime);
    check(
      lifetimeMeta.status === "ready" &&
        lifetimeMeta.coverage?.start === "2023-09-01" &&
        lifetimeMeta.details?.days?.[0].date === "2023-09-01" &&
        lifetimeMeta.details?.days?.at(-1)?.date === "2026-09-30" &&
        lifetimeMeta.previous === undefined &&
        lifetimeMeta.details?.previousDays === undefined &&
        calls === 13,
      "All-time Meta uses its own available history for totals and daily reports, without comparison requests",
    );
    let emptyMetaCalls = 0;
    const emptyMeta = await fetchMetaOverview(
      settings,
      lifetime,
      async (path) => {
        emptyMetaCalls++;
        return path.includes("/insights?")
          ? { data: [] }
          : {
              name: "Empty account",
              currency: "GBP",
              timezone_name: "Europe/London",
            };
      },
    );
    check(
      emptyMeta.status === "ready" &&
        emptyMeta.current?.spend === 0 &&
        emptyMeta.details?.days?.length === 0 &&
        emptyMetaCalls === 2,
      "An empty all-time Meta account has no invented daily history or redundant detail requests",
    );
    await executeMutation(
      "INSERT INTO meta_event_jobs (pixel_id,event_id,event_name,test_event_code,status,event_time) VALUES ('123456789','a','PageView','','SENT','2026-09-01'),('123456789','b','PageView','TEST','SENT','2026-09-01'),('999999999','c','PageView','','SENT','2026-09-01')",
    );
    const tracking = await getTrackingHealth(range);
    check(
      tracking.length === 1 && tracking[0].value === 1,
      "Traffic delivery counts exclude test events and previously configured pixels",
    );
    check(
      (await getTrackingHealth(emptyHistory))[0]?.value === 1,
      "All-time tracking includes all retained live event records, even before the store start",
    );
    await executeMutation("INSERT INTO meta_event_jobs (pixel_id,event_id,event_name,status,event_time) VALUES ('123456789','before-la','PageView','FAILED','2026-09-30 06:59:59.999'),('123456789','start-la','PageView','SENT','2026-09-30 07:00:00'),('123456789','end-la','PageView','SENT','2026-10-01 06:59:59.999'),('123456789','after-la','PageView','CANCELLED','2026-10-01 07:00:00')");
    const laDay = dashboardRange({ range: "custom", start: "2026-09-30", end: "2026-09-30" }, new Date("2026-10-01T12:00:00Z"), undefined, "America/Los_Angeles");
    const laTracking = await getTrackingHealth(laDay);
    check(laTracking.length === 1 && laTracking[0].status === "SENT" && laTracking[0].value === 2, "Traffic counts include the selected account day at both boundaries, excluding adjacent days");
    const ukTracking = await getTrackingHealth({ ...laDay, timeZone: "Europe/London" });
    check(ukTracking.length === 2 && ukTracking.find(row => row.status === "FAILED")?.value === 1 && ukTracking.find(row => row.status === "SENT")?.value === 1, "Changing the calendar changes the event boundaries rather than reusing a stale report");
    await executeMutation(`INSERT INTO meta_event_jobs (pixel_id,event_id,event_name,status,test_event_code,event_time,matching_fields_json) VALUES
      ('123456789','coverage-start','ViewContent','SENT','','2026-09-30 07:00:00','{"em":true,"external_id":true}'),
      ('123456789','coverage-legacy','ViewContent','SENT','','2026-10-01 06:59:59.999',NULL),
      ('123456789','coverage-after','ViewContent','SENT','','2026-10-01 07:00:00','{"ph":true}'),
      ('123456789','coverage-before','ViewContent','SENT','','2026-09-30 06:59:59.999','{"ph":true}'),
      ('123456789','coverage-test','Purchase','SENT','TEST123','2026-09-30 12:00:00','{"em":true}'),
      ('123456789','coverage-failed','Purchase','FAILED','','2026-09-30 12:00:00','{"em":true}'),
      ('987654321','coverage-other-pixel','Purchase','SENT','','2026-09-30 12:00:00','{"em":true}')`);
    const matching = await getMetaMatchingReport(laDay);
    const views = matching.find(row => row.name === "ViewContent");
    check(views?.total === 2 && views.known === 1 && views.fields.em === 1 && views.fields.ph === 0 && views.fields.external_id === 1, "Matching coverage obeys the exact selected day and excludes unknown legacy coverage from percentages");
    check(!matching.some(row => row.name === "Purchase"), "Coverage excludes failed jobs, test events and other datasets");
    const ukMatching = (await getMetaMatchingReport({ ...laDay, timeZone: "Europe/London" })).find(row => row.name === "ViewContent");
    check(ukMatching?.known === 2 && ukMatching.fields.ph === 1, "Coverage date filtering changes with the account calendar");
    denyDetails = true;
    const partialMeta = await getMetaOverview({
      ...range,
      start: "2026-08-31",
      previousStart: "2026-08-28",
      previousEnd: "2026-08-30",
      days: 3,
    });
    check(
      partialMeta.status === "ready" &&
        partialMeta.current?.spend === 25 &&
        partialMeta.details?.errors.length === 5 &&
        partialMeta.details?.days === undefined,
      "Detail endpoint failures retain valid account totals without inventing daily zeros",
    );
    denyDetails = false;
    deny = true;
    await executeMutation(
      "UPDATE site_settings SET value_json=? WHERE setting_key='meta.configuration'",
      [JSON.stringify({ ...settings, adAccountId: "987654321" })],
    );
    const rejected = await getMetaOverview(range);
    check(
      rejected.status === "error" &&
        rejected.current === undefined &&
        !rejected.message?.includes("Private upstream"),
      "Changed credentials invalidate cached results; permission errors are safe and never shown as zero",
    );
    console.log(
      `${checks} dashboard integration checks passed; disposable database and mocked Meta only.`,
    );
  } finally {
    globalThis.fetch = originalFetch;
    await globalThis.n7MySqlPool?.end();
    globalThis.n7MySqlPool = undefined;
    if (created) await setup.query(`DROP DATABASE \`${database}\``);
    await setup.end();
  }
}
void run().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Dashboard checks failed",
  );
  process.exitCode = 1;
});
