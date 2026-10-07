import "./load-env";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import mysql, { type RowDataPacket } from "mysql2/promise";
import { z } from "zod";
import { getDatabaseConfig } from "../lib/env";
import { executeMutation, selectOne, selectRows } from "../lib/db/query";
import { encryptSecret } from "../lib/security/encryption";
import { getMetaCatalogSettings } from "../lib/meta/catalog-settings";
import { getCatalogSnapshot } from "../lib/meta/catalog-data";
import { getMetaCatalogSummary } from "../lib/meta/catalog-status";
import { processMetaCatalog, requestCatalogSync } from "../lib/meta/catalog-sync";
import { metaContentId } from "../lib/meta/shared";
import { refreshMetaCatalogObservations } from "../lib/meta/catalog-observation-sync";

const batchSchema = z.object({
  item_type: z.literal("PRODUCT_ITEM"), allow_upsert: z.literal(true),
  requests: z.array(z.object({ method: z.enum(["UPDATE", "DELETE"]), data: z.object({ id: z.string() }).passthrough() })).min(1).max(50),
});
interface Job extends RowDataPacket {
  retailer_id: string; status: string; attempts: number; desired_hash: string; sent_hash: string | null;
  submitted_hash: string | null; request_handle: string | null; last_error: string | null;
  operation: "UPSERT" | "DELETE";
}

async function run() {
  const config = getDatabaseConfig();
  assert.ok(["127.0.0.1", "localhost", "::1"].includes(config.host), "Checks require a local database");
  const database = `n7_catalog_test_${Date.now()}`;
  assert.match(database, /^n7_catalog_test_\d+$/);
  const options = { host: config.host, port: config.port, user: process.env.DB_ROOT_PASSWORD ? "root" : config.user, password: process.env.DB_ROOT_PASSWORD || config.password };
  const setup = await mysql.createConnection({ ...options, multipleStatements: true });
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.APP_URL;
  process.env.APP_URL = "https://n7cosmetics.co.uk";
  let created = false, checks = 0, readCalls = 0, sequence = 0, postStatus = 200, pollHttpStatus = 200;
  let pollStatus = "finished", pollErrors = 0, receiptCount = 1;
  let remoteMode = "normal", remoteCalls = 0;
  const batches: z.infer<typeof batchSchema>[] = [];
  const check = (value: unknown, message: string) => { assert.ok(value, message); checks++; };
  try {
    await setup.query(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`); created = true;
    await setup.changeUser({ database });
    for (const name of (await readdir("database/migrations")).filter(name => name.endsWith(".sql")).sort()) await setup.query(await readFile(`database/migrations/${name}`, "utf8"));
    globalThis.n7MySqlPool = mysql.createPool({ ...options, database, connectionLimit: 8, supportBigNumbers: true, bigNumberStrings: true, timezone: "Z" });
    const catalogId = "123456789";
    globalThis.fetch = async (input, init) => {
      const url = new URL(String(input));
      assert.equal(url.origin, "https://graph.facebook.com");
      assert.equal(url.searchParams.has("access_token"), false);
      assert.equal(new Headers(init?.headers).get("authorization"), "Bearer fake-catalog-token");
      const apiError = (status: number) => Response.json({ error: { code: status === 503 ? 2 : 190, is_transient: status === 503, message: "Never persist fake-catalog-token or private@example.com" } }, { status });
      if (url.pathname.endsWith("/products")) {
        remoteCalls++;
        assert.equal(init?.method, "GET");
        const ids = z.object({ retailer_id: z.object({ is_any: z.array(z.string().regex(/^n7_variant_[1-9]\d*$/)).max(50) }) }).parse(JSON.parse(url.searchParams.get("filter") ?? "{}"));
        if (remoteMode === "outage") return apiError(503);
        if (remoteMode === "malformed") return Response.json({ unexpected: true });
        if (remoteMode === "missing") return Response.json({ data: [] });
        const rows = await selectRows<RowDataPacket & { retailer_id: string; desired_payload: unknown }>("SELECT retailer_id,desired_payload FROM meta_catalog_items WHERE catalog_id = ? AND operation = 'UPSERT' AND status = 'SYNCED'", [catalogId]);
        const data = rows.filter(row => ids.retailer_id.is_any.includes(row.retailer_id)).map((row, index) => {
          const request = batchSchema.shape.requests.element.parse(typeof row.desired_payload === "string" ? JSON.parse(row.desired_payload) : row.desired_payload);
          return { id: String(900000 + index), retailer_id: row.retailer_id, image_url: request.data.image_link, image_fetch_status: index === 0 || remoteMode === "ready" ? "FETCHED" : "NO_STATUS", capability_to_review_status: [{ key: "DA", value: index === 0 ? "APPROVED" : "NO_REVIEW" }], errors: index > 0 && remoteMode !== "ready" ? [{ error_type: "invalid_images", error_priority: "high", title: "Missing or invalid images", description: "<b>Meta cannot display the image.</b>" }] : [] };
        });
        if (remoteMode === "changing") await executeMutation("UPDATE meta_catalog_items SET desired_hash = REPEAT('b',64) WHERE catalog_id = ? AND retailer_id = ?", [catalogId, ids.retailer_id.is_any[0]]);
        if (remoteMode === "pagination") return Response.json({ data: data.slice(0, 1), paging: { next: "https://graph.facebook.com/never-follow-this-url", cursors: { after: "repeated-cursor" } } });
        return Response.json({ data: [...data, { id: "999", retailer_id: "shopify_legacy", image_fetch_status: "FETCHED" }], paging: { next: "https://graph.facebook.com/unused" } });
      }
      if (url.pathname.endsWith("/items_batch")) {
        const body = batchSchema.parse(JSON.parse(String(init?.body)));
        for (const request of body.requests) {
          assert.match(request.data.id, /^n7_variant_[1-9]\d*$/);
          assert.equal("retailer_id" in request.data, false);
          if (request.method === "UPDATE") {
            assert.match(String(request.data.price), /^\d+\.\d{2} GBP$/);
            assert.ok(String(request.data.link).startsWith("https://n7cosmetics.co.uk/"));
          }
        }
        batches.push(body);
        if (postStatus !== 200) return apiError(postStatus);
        sequence++;
        return Response.json({ handles: Array.from({ length: receiptCount }, (_, index) => `batch-${sequence}-${index}`) });
      }
      if (url.pathname.endsWith("/check_batch_request_status")) {
        return pollHttpStatus === 200 ? Response.json({ data: [{ handle: url.searchParams.get("handle"), status: pollStatus, errors_total_count: pollErrors, errors: pollErrors ? [{ message: "private@example.com" }] : [] }] }) : apiError(pollHttpStatus);
      }
      assert.equal(url.pathname, `/v26.0/${catalogId}`);
      readCalls++;
      return Response.json({ id: catalogId, name: "N7 catalogue fixture", vertical: "commerce" });
    };
    const save = async (enabled = true, token = "fake-catalog-token") => executeMutation(`INSERT INTO site_settings (setting_key, setting_group, value_json, is_public)
      VALUES ('meta.catalog.configuration', 'meta', ?, 0) ON DUPLICATE KEY UPDATE value_json = VALUES(value_json)`, [JSON.stringify({ catalogId, enabled, tokenEncrypted: token ? encryptSecret(token) : "" })]);
    const job = async (id: string) => selectOne<Job>("SELECT * FROM meta_catalog_items WHERE catalog_id = ? AND retailer_id = ?", [catalogId, id]);
    const due = async (scan = false) => {
      await executeMutation(`UPDATE meta_catalog_state SET next_run_at = CURRENT_TIMESTAMP(3)${scan ? ", last_scanned_at = DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 31 SECOND)" : ""} WHERE catalog_id = ?`, [catalogId]);
      await executeMutation("UPDATE meta_catalog_items SET next_attempt_at = CURRENT_TIMESTAMP(3) WHERE catalog_id = ?", [catalogId]);
    };
    const confirm = async () => { await due(); await processMetaCatalog(); };
    const fixture = async (slug: string, type: "STANDARD" | "BUNDLE" = "STANDARD", stock = 17, track = true, image = true) => {
      const product = await executeMutation("INSERT INTO products (name, slug, product_type, status, track_inventory, product_code, description) VALUES (?, ?, ?, 'ACTIVE', ?, '101', '<p>Fresh fragrance.</p>')", [slug, slug, type, track]);
      const variant = await executeMutation("INSERT INTO product_variants (product_id, title, sku, price_pence, compare_at_price_pence, stock_on_hand, is_default) VALUES (?, '100 ml', ?, 3701, 5000, ?, 1)", [product.insertId, slug, stock]);
      if (image) await executeMutation("INSERT INTO product_images (product_id, url) VALUES (?, '/media/catalog-fixture')", [product.insertId]);
      return { productId: String(product.insertId), variantId: String(variant.insertId), id: metaContentId(String(variant.insertId)) };
    };
    const standard = await fixture("catalog-standard");
    const unlimited = await fixture("catalog-untracked", "STANDARD", 0, false);
    const soldOut = await fixture("catalog-sold-out", "STANDARD", 0);
    const excluded = await fixture("catalog-no-image", "STANDARD", 10, true, false);
    const bundle = await fixture("catalog-bundle", "BUNDLE", 100);
    await executeMutation("INSERT INTO bundle_items (bundle_product_id, component_variant_id, quantity) VALUES (?, ?, 2)", [bundle.productId, standard.variantId]);
    await executeMutation("INSERT INTO product_variants (product_id, title, sku, price_pence, stock_on_hand, is_default) VALUES (?, 'Unused variation', 'catalog-extra', 999, 100, 0)", [standard.productId]);
    const draft = await fixture("catalog-draft");
    await executeMutation("UPDATE products SET status = 'DRAFT' WHERE id = ?", [draft.productId]);
    check(await processMetaCatalog() === 0 && batches.length === 0 && readCalls === 0, "No credentials means no outbound catalogue calls");
    await save(true, ""); await processMetaCatalog();
    check(readCalls === 0 && batches.length === 0, "Catalogue ID alone cannot upload products");
    await save();
    check(!(await getMetaCatalogSettings()).tokenEncrypted.includes("fake-catalog-token"), "Catalogue token is encrypted at rest");
    const snapshot = await getCatalogSnapshot();
    check(snapshot.length === 5 && !snapshot.some(item => item.id === draft.id), "Only published storefront variants are included");
    check(snapshot.find(item => item.id === bundle.id)?.item?.quantity_to_sell_on_facebook === 8, "Bundle availability reflects component requirements");
    check(snapshot.find(item => item.id === unlimited.id)?.item?.quantity_to_sell_on_facebook === undefined, "Untracked products have no invented stock count");
    check(snapshot.find(item => item.id === soldOut.id)?.item?.availability === "out of stock", "Published sold-out items stay in the catalogue");
    check(snapshot.find(item => item.id === standard.id)?.item?.price === "37.01 GBP", "Catalogue price is the storefront unit price, not compare-at or a cart offer");
    await Promise.all([processMetaCatalog(), processMetaCatalog()]);
    check(readCalls === 1 && batches.length === 1, "A per-catalogue lease prevents duplicate concurrent uploads");
    check(batches[0].requests.length === 4 && !batches[0].requests.some(row => row.data.id === excluded.id), "Missing images exclude only the invalid product");
    check((await job(excluded.id))?.status === "EXCLUDED", "Excluded items have a recorded issue");
    check((await job(standard.id))?.status === "SUBMITTED" && !(await getMetaCatalogSummary()).lastSuccess, "A submission receipt is not reported as confirmed sync");
    pollStatus = "in progress"; await confirm();
    check((await job(standard.id))?.status === "SUBMITTED", "Pending Meta processing retains the receipt");
    pollHttpStatus = 503; await confirm();
    check((await job(standard.id))?.status === "SUBMITTED" && batches.length === 1, "Polling outages retain the receipt without resubmitting");
    pollHttpStatus = 200; pollStatus = "finished"; await confirm();
    check((await job(standard.id))?.status === "SYNCED" && Boolean((await getMetaCatalogSummary()).lastSuccess), "Only a completed successful Meta batch becomes synced");
    await due(true); await processMetaCatalog();
    check(batches.length === 1, "Unchanged products do not trigger repeated uploads");

    await executeMutation("UPDATE product_variants SET stock_on_hand = 0, price_pence = 4200 WHERE id = ?", [standard.variantId]);
    await executeMutation("UPDATE products SET name = 'Updated name', product_code = '102' WHERE id = ?", [standard.productId]);
    await due(true); await processMetaCatalog();
    const changed = batches.at(-1)?.requests;
    check(changed?.length === 2 && changed.find(row => row.data.id === standard.id)?.data.title === "102 — Updated name", "Product edits and shared bundle stock changes queue automatically");
    check(changed?.every(row => row.data.availability === "out of stock") && changed.find(row => row.data.id === standard.id)?.data.price === "42.00 GBP", "Stock and price use the latest database values");
    await executeMutation("UPDATE product_variants SET stock_on_hand = 10 WHERE id = ?", [standard.variantId]);
    pollStatus = "in progress";
    await due(true); await processMetaCatalog();
    check(batches.length === 2 && (await job(standard.id))?.desired_hash !== (await job(standard.id))?.submitted_hash, "An edit during an in-flight batch preserves the new desired state");
    pollStatus = "finished";
    await confirm();
    check(batches.length === 3 && batches.at(-1)?.requests.find(row => row.data.id === bundle.id)?.data.quantity_to_sell_on_facebook === 5, "After confirmation, a newer product version is submitted");
    await confirm();
    check((await job(standard.id))?.desired_hash === (await job(standard.id))?.sent_hash, "Confirmed version matches the latest stock and price");

    const beforeRetry = batches.length;
    postStatus = 503;
    await executeMutation("UPDATE product_variants SET price_pence = 4300 WHERE id = ?", [standard.variantId]);
    await due(true); await processMetaCatalog();
    check((await job(standard.id))?.status === "QUEUED" && (await job(standard.id))?.attempts === 1, "Transient submission errors queue a bounded retry");
    await processMetaCatalog();
    check(batches.length === beforeRetry + 1, "A worker loop honours retry backoff");
    postStatus = 200; await due(); await processMetaCatalog(); await confirm();
    check((await job(standard.id))?.status === "SYNCED" && batches.at(-1)?.requests[0].data.id === standard.id, "Retry uses the same stable product ID");

    postStatus = 400;
    await executeMutation("UPDATE product_variants SET price_pence = 4400 WHERE id = ?", [standard.variantId]);
    await due(true); await processMetaCatalog();
    check((await job(standard.id))?.status === "FAILED", "Permanent credential errors are visible and stop automatic retrying");
    check(!(await job(standard.id))?.last_error?.includes("fake-catalog-token") && !(await job(standard.id))?.last_error?.includes("private@example.com"), "Meta error text cannot expose secrets in status");
    postStatus = 200; await requestCatalogSync(await getMetaCatalogSettings()); await processMetaCatalog();
    pollErrors = 1; await confirm();
    check((await job(standard.id))?.status === "FAILED", "Partial batch errors never falsely mark products synced");
    pollErrors = 0; await requestCatalogSync(await getMetaCatalogSettings()); await processMetaCatalog(); await confirm();
    check((await job(standard.id))?.status === "SYNCED", "Sync now retries failed products after their issue is resolved");

    const beforePause = batches.length;
    await save(false); await executeMutation("UPDATE product_variants SET stock_on_hand = 9 WHERE id = ?", [standard.variantId]);
    await due(true); await processMetaCatalog();
    check(batches.length === beforePause, "Pausing sync stops uploads and preserves existing Meta items");
    await save(); await due(true); await processMetaCatalog(); await confirm();
    check(batches.length > beforePause, "Resuming observes changes made while paused");

    await executeMutation("UPDATE products SET status = 'ARCHIVED' WHERE id = ?", [unlimited.productId]);
    await executeMutation("DELETE FROM products WHERE id = ?", [soldOut.productId]);
    postStatus = 400;
    await due(true); await processMetaCatalog();
    const deletes = batches.at(-1)?.requests;
    check(deletes?.length === 2 && deletes.every(row => row.method === "DELETE") && deletes.some(row => row.data.id === unlimited.id) && deletes.some(row => row.data.id === soldOut.id), "Unpublished and deleted managed products queue their matching IDs for removal");
    check((await job(soldOut.id))?.status === "FAILED", "A rejected product removal remains visible for retry");
    postStatus = 200;
    await requestCatalogSync(await getMetaCatalogSettings()); await processMetaCatalog();
    check(batches.at(-1)?.requests.some(row => row.method === "DELETE" && row.data.id === soldOut.id), "Explicit retry includes failed removal tombstones after the product is gone");
    await confirm();
    check((await job(unlimited.id))?.status === "DELETED" && (await job(soldOut.id))?.status === "DELETED", "Deleted product tombstones survive local product removal");

    await executeMutation("DELETE FROM product_images WHERE product_id = ?", [standard.productId]);
    await due(true); await processMetaCatalog();
    check(batches.at(-1)?.requests[0].method === "DELETE" && batches.at(-1)?.requests[0].data.id === standard.id, "A formerly synced item losing required details is removed rather than left stale");
    await confirm();
    check((await job(standard.id))?.status === "EXCLUDED", "Confirmed removal of an invalid product remains visible for correction");
    await executeMutation("INSERT INTO product_images (product_id, url) VALUES (?, '/media/restored-image')", [standard.productId]);
    await due(true); await processMetaCatalog(); await confirm();
    check((await job(standard.id))?.status === "SYNCED", "Correcting required details restores the original catalogue ID");

    await executeMutation("UPDATE meta_catalog_items SET status = 'PROCESSING', submitted_hash = desired_hash, next_attempt_at = DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 4 MINUTE) WHERE retailer_id = ? AND catalog_id = ?", [standard.id, catalogId]);
    const beforeRecovery = batches.length;
    await processMetaCatalog();
    check(batches.length === beforeRecovery + 1 && (await job(standard.id))?.status === "SUBMITTED", "Interrupted worker claims recover with an idempotent submission");
    await confirm();

    receiptCount = 3;
    await requestCatalogSync(await getMetaCatalogSettings()); await processMetaCatalog();
    check(JSON.parse((await job(standard.id))!.request_handle!).length === 3, "All Meta receipt handles are durably retained");
    await confirm();
    check((await job(standard.id))?.status === "SUBMITTED" && JSON.parse((await job(standard.id))!.request_handle!).length === 1, "A multi-handle receipt stays processing until every handle completes");
    await confirm(); receiptCount = 1;
    check((await job(standard.id))?.status === "SYNCED", "Multiple Meta handles are fully confirmed before success");

    const beforeFailure = batches.length;
    await due(true); await executeMutation("RENAME TABLE product_images TO catalog_images_unavailable");
    try { await processMetaCatalog(); }
    finally { await executeMutation("RENAME TABLE catalog_images_unavailable TO product_images"); }
    check(batches.length === beforeFailure && (await job(standard.id))?.operation !== "DELETE", "A failed product scan cannot mass-delete the catalogue");
    check(Boolean((await getMetaCatalogSummary()).error), "Scanner failures have a visible safe error");
    await due(true); await processMetaCatalog();
    await executeMutation("UPDATE meta_catalog_state SET last_full_sync_at = DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 2 DAY) WHERE catalog_id = ?", [catalogId]);
    await due(); await processMetaCatalog();
    check(batches.length === beforeFailure + 1 && batches.at(-1)?.requests.every(row => row.method === "UPDATE"), "Daily reconciliation restores only this integration’s eligible items");
    await confirm();
    const summary = await getMetaCatalogSummary();
    check(summary.accessVerified && summary.eligible === 2 && summary.excluded === 1 && summary.counts.SYNCED === 2, "Admin status reports actual connection, queue and website counts");
    check(!JSON.stringify(summary).includes("tokenEncrypted") && !JSON.stringify(summary).includes("fake-catalog-token"), "Admin status contains no access token or ciphertext");
    const finalJobs = await selectRows<Job>("SELECT * FROM meta_catalog_items WHERE catalog_id = ?", [catalogId]);
    check(finalJobs.every(row => row.retailer_id.startsWith("n7_variant_")), "Sync never takes ownership of Shopify, WooCommerce or unrelated catalogue IDs");

    const remoteDue = async () => {
      await executeMutation("UPDATE meta_catalog_remote_checks SET next_check_at = CURRENT_TIMESTAMP(3) WHERE catalog_id = ?", [catalogId]);
      await executeMutation("UPDATE meta_catalog_items SET meta_checked_at = DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 31 SECOND) WHERE catalog_id = ?", [catalogId]);
    };
    check(summary.remote.checked === 0 && summary.remote.adsEligible === 0 && summary.remote.adsUnknown === 2, "Successful product sync alone cannot become ad eligibility");
    await Promise.all([refreshMetaCatalogObservations(), refreshMetaCatalogObservations()]);
    let remote = (await getMetaCatalogSummary()).remote;
    check(remoteCalls === 1 && remote.checked === 2, "A shared database lease prevents duplicate live Meta status reads");
    check(remote.imagesReady === 1 && remote.imageFailures === 1 && remote.adsEligible === 1 && remote.adsBlocked === 1, "Image errors and explicit ad approval are counted independently");
    check(remote.items.every(item => item.id.startsWith("n7_variant_")) && remote.items.some(item => item.issues[0]?.message === "Meta cannot display the image."), "Meta product errors are plain text and unrelated sources are ignored");
    await refreshMetaCatalogObservations();
    check(remoteCalls === 1, "Status reads respect the 30-second polling interval");
    const observed = await selectOne<RowDataPacket & { meta_observation: unknown }>("SELECT meta_observation FROM meta_catalog_items WHERE retailer_id = ? AND catalog_id = ?", [standard.id, catalogId]);
    await remoteDue(); remoteMode = "malformed"; await refreshMetaCatalogObservations();
    check(Boolean((await getMetaCatalogSummary()).remote.error) && JSON.stringify((await selectOne<RowDataPacket>("SELECT meta_observation FROM meta_catalog_items WHERE retailer_id = ? AND catalog_id = ?", [standard.id, catalogId]))?.meta_observation) === JSON.stringify(observed?.meta_observation), "Malformed Meta status never overwrites prior observations or fabricates missing items");
    await remoteDue(); remoteMode = "pagination"; await refreshMetaCatalogObservations();
    check((await getMetaCatalogSummary()).remote.error?.includes("pagination"), "Incomplete or repeated Meta cursors retain previous data and report the failed check");
    await remoteDue(); remoteMode = "outage";
    await executeMutation("UPDATE meta_catalog_items SET meta_checked_at = DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 3 MINUTE) WHERE catalog_id = ?", [catalogId]);
    await refreshMetaCatalogObservations(); remote = (await getMetaCatalogSummary()).remote;
    check(remote.checked === 0 && remote.adsEligible === 0 && remote.adsUnknown === 2 && Boolean(remote.error), "An API outage does not present expired cached approval as current");
    check(!JSON.stringify(remote).includes("fake-catalog-token") && !JSON.stringify(remote).includes("private@example.com"), "Status error responses cannot expose token or raw API error text");
    await remoteDue(); remoteMode = "ready"; await refreshMetaCatalogObservations(); remote = (await getMetaCatalogSummary()).remote;
    check(remote.imagesReady === 2 && remote.adsEligible === 1 && remote.adsUnknown === 1 && !remote.error, "Recovered image downloads do not falsely approve NO_REVIEW products");
    await save(); remote = (await getMetaCatalogSummary()).remote;
    check(remote.checked === 0 && remote.adsEligible === 0, "Changed credentials invalidate observations from the previous settings revision");
    await refreshMetaCatalogObservations();
    check((await getMetaCatalogSummary()).remote.checked === 2, "New credentials trigger a fresh status read without waiting for the old interval");
    await remoteDue(); remoteMode = "missing"; await refreshMetaCatalogObservations();
    check((await getMetaCatalogSummary()).remote.items.every(item => item.issues[0]?.code === "not_found"), "Only a completed valid Meta response marks a missing remote item");
    await remoteDue(); remoteMode = "changing"; await refreshMetaCatalogObservations();
    remote = (await getMetaCatalogSummary()).remote;
    check(remote.checked === 1 && remote.adsEligible === 0, "A concurrent product edit cannot store eligibility for an outdated payload");
    await save(false); const beforePausedRead = remoteCalls; await refreshMetaCatalogObservations();
    check(remoteCalls === beforePausedRead, "A paused catalogue connection stops outgoing status requests");
    console.log(`${checks} catalogue integration checks passed; all Meta calls mocked, disposable local database removed.`);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.APP_URL; else process.env.APP_URL = originalUrl;
    await globalThis.n7MySqlPool?.end(); globalThis.n7MySqlPool = undefined;
    if (created) await setup.query(`DROP DATABASE \`${database}\``);
    await setup.end();
  }
}
void run().catch(error => { console.error(error instanceof Error ? error.message : "Catalogue checks failed"); process.exitCode = 1; });
