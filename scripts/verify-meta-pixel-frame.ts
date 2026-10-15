import "./load-env";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { readFile, readdir } from "node:fs/promises";
import { createServer } from "node:net";
import { Script } from "node:vm";
import mysql from "mysql2/promise";
import { getDatabaseConfig } from "../lib/env";
import { defaultMetaSettings } from "../lib/meta/settings";
import { hashMetaValue } from "../lib/meta/identity";
import { defaultTikTokSettings } from "../lib/tiktok/settings";

async function run() {
  const config = getDatabaseConfig();
  assert.ok(["127.0.0.1", "localhost", "::1"].includes(config.host), "Checks require a local database");
  const database = `n7_pixel_test_${Date.now()}`;
  assert.match(database, /^n7_pixel_test_\d+$/);
  const credentials = { host: config.host, port: config.port, user: process.env.DB_ROOT_PASSWORD ? "root" : config.user, password: process.env.DB_ROOT_PASSWORD || config.password };
  const setup = await mysql.createConnection({ ...credentials, multipleStatements: true });
  let created = false;
  let server: ReturnType<typeof spawn> | undefined;
  let checks = 0;
  const check = (value: unknown, message: string) => { assert.ok(value, message); checks++; };
  try {
    await setup.query(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`); created = true;
    await setup.changeUser({ database });
    for (const name of (await readdir("database/migrations")).filter(name => name.endsWith(".sql")).sort()) await setup.query(await readFile(`database/migrations/${name}`, "utf8"));
    const pixelId = "123456789";
    // Pixel-only fixtures cannot enqueue or send external CAPI calls.
    const settings = { ...defaultMetaSettings, pixelId };
    const save = (value: typeof settings) => setup.query("UPDATE site_settings SET value_json = ? WHERE setting_key = 'meta.configuration'", [JSON.stringify(value)]);
    await save(settings);
    await setup.query("UPDATE site_settings SET value_json = ? WHERE setting_key = 'tiktok.configuration'", [JSON.stringify({ ...defaultTikTokSettings, serverEnabled: false })]);
    const probe = createServer(); probe.listen(0, "127.0.0.1"); await once(probe, "listening");
    const address = probe.address(); assert.ok(address && typeof address !== "string");
    const port = address.port; await new Promise<void>(resolve => probe.close(() => resolve()));
    const origin = `http://127.0.0.1:${port}`;
    server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
      windowsHide: true, stdio: "pipe", env: { ...process.env, APP_URL: origin, DB_NAME: database, DB_USER: credentials.user, DB_PASSWORD: credentials.password },
    });
    server.stdout?.resume(); server.stderr?.resume();
    let startupError: Error | undefined;
    server.on("error", error => { startupError = error; });
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (startupError) throw startupError;
      assert.equal(server.exitCode, null, "Production server exited; run pnpm build:deploy first");
      try { ready = (await fetch(`${origin}/api/meta/config`, { signal: AbortSignal.timeout(1000) })).ok; } catch { /* Wait for startup. */ }
      if (ready) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    check(ready, "The built production server starts");
    const channel = randomUUID(), path = `/api/meta/pixel-frame?channel=${channel}`;
    const get = (cookie = "") => fetch(origin + path, { headers: { cookie } });
    const tiktokChannel = randomUUID();
    const tiktokPath = `/api/tiktok/pixel-frame?channel=${tiktokChannel}`;
    const getTikTok = (cookie = "") => fetch(origin + tiktokPath, { headers: { cookie } });
    check((await get()).status === 204, "Unknown consent returns no Pixel document");
    check((await getTikTok()).status === 204, "Unknown consent returns no TikTok document");
    const consent = await fetch(`${origin}/api/meta/consent`, { method: "POST", headers: { origin, "Content-Type": "application/json" }, body: '{"granted":true}' });
    check(consent.ok, "Explicit marketing consent is saved");
    const cookie = consent.headers.getSetCookie().find(value => value.startsWith("n7_marketing_consent="))?.split(";")[0]; assert.ok(cookie);
    check((await get(`${cookie}; n7_marketing_optout=1`)).status === 204, "Essential-only opt-out overrides a stale consent grant");
    check((await getTikTok(`${cookie}; n7_marketing_optout=1`)).status === 204, "Essential-only opt-out also blocks TikTok with a stale grant");
    const tiktok = await getTikTok(cookie);
    const tiktokHtml = await tiktok.text();
    check(tiktok.ok && tiktokHtml.includes("DB7Q61BC77UCS546PMGG") && tiktokHtml.includes("analytics.tiktok.com/i18n/pixel/events.js"), "Granted consent receives the configured TikTok measurement document");
    check(!tiktokHtml.includes("ttq.page()") && !tiktokHtml.includes("private-receipt") && !tiktokHtml.includes("private-payment"), "TikTok has no implicit page event or receipt/payment credentials");
    check(tiktok.headers.get("cache-control")?.includes("no-store") && tiktok.headers.get("referrer-policy") === "no-referrer", "TikTok permission and page context cannot be cached or leaked through a referrer");
    check((await fetch(`${origin}/api/tiktok/pixel-frame?page=${encodeURIComponent('/admin/orders')}`, { headers: { cookie } })).status === 400, "TikTok rejects admin paths even with valid marketing permission");
    const response = await get(cookie);
    check(response.status === 200 && response.headers.get("content-type")?.startsWith("text/html"), "Granted consent receives a Pixel document");
    check(response.headers.get("cache-control")?.includes("no-store"), "The consent-bound document cannot be cached");
    check(response.headers.get("x-frame-options") === "SAMEORIGIN" && response.headers.get("content-security-policy")?.includes("frame-ancestors 'self'"), "Other websites cannot embed the document");
    check(response.headers.get("referrer-policy") === "no-referrer", "Frame requests do not disclose checkout credentials in a referrer");
    const configResponse = await (await fetch(`${origin}/api/meta/config`, { headers: { cookie } })).json();
    const script = (await response.text()).match(/<script>([\s\S]*)<\/script>/)?.[1]; assert.ok(script);
    const replies: unknown[] = [], scripts: { src: string }[] = [], urls: string[] = [];
    let handler: (message: unknown) => void = () => undefined;
    const parent = { postMessage(message: unknown) { replies.push(message); } };
    const context = { window: { parent, addEventListener(_type: string, listener: typeof handler) { handler = listener; } },
      location: { origin }, history: { replaceState(_state: unknown, _unused: string, url: string) { urls.push(url); } },
      document: { createElement() { return {}; }, head: { appendChild(value: typeof scripts[number]) { scripts.push(value); } } }, URL, setTimeout,
    };
    // Execute the actual Next production output with plain object fixtures.
    // This is not a browser and it makes no SDK/Meta requests.
    new Script(script).runInNewContext(context);
    check(scripts.length === 0 && JSON.stringify(replies).includes("n7:meta-pixel-loaded"), "Production bundling preserves a self-contained handshake without pre-init tracking");
    const input = { email: "Synthetic@Example.test", phone: "07123 456789", fullName: "Synthetic Buyer", city: "London", region: "Greater London", postalCode: "SW1A 1AA", countryCode: "GB" };
    const tiktokConfig = await (await fetch(`${origin}/api/tiktok/config`, { headers: { cookie } })).json();
    check(tiktokConfig.enabled && tiktokConfig.consent === "granted" && !JSON.stringify(tiktokConfig).includes("accessToken"), "TikTok config exposes consent and public identity without credentials");
    const tiktokMatching = await fetch(`${origin}/api/tiktok/matching`, { method: "POST", headers: { cookie, origin, "Content-Type": "application/json" }, body: JSON.stringify(input) });
    check(tiktokMatching.ok && tiktokMatching.status !== 204, "TikTok matching works independently with server tracking disabled");
    const tiktokEventInput = { name: "Pageview", eventId: randomUUID(), path: "/checkout" };
    const collectTikTok = (body: unknown, requestOrigin = origin) => fetch(`${origin}/api/tiktok/events`, { method: "POST", headers: { cookie, origin: requestOrigin, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const tiktokEvent = await collectTikTok(tiktokEventInput);
    const tiktokBrowser = await tiktokEvent.json();
    check(tiktokEvent.ok && tiktokBrowser.name === "Pageview" && tiktokBrowser.eventId === tiktokEventInput.eventId && tiktokBrowser.externalId === tiktokConfig.externalId, "TikTok production collection returns canonical event identity");
    check(tiktokBrowser.matching.email === hashMetaValue("synthetic@example.test") && tiktokBrowser.matching.phone === hashMetaValue("+447123456789"), "Production Pixel receives the supported normalized contact hashes");
    check((await collectTikTok({ ...tiktokEventInput, name: "Purchase" })).status === 400, "Public clients cannot manufacture TikTok purchases");
    check((await collectTikTok({ ...tiktokEventInput, value: 0.01 })).status === 400, "Public clients cannot supply TikTok prices");
    check((await collectTikTok(tiktokEventInput, "https://foreign.test")).status === 403, "Foreign origins cannot collect TikTok events");
    const [fixtureProduct] = await setup.query<mysql.ResultSetHeader>("INSERT INTO products (name, slug, status) VALUES ('TikTok HTTP fixture', 'tiktok-http-fixture', 'ACTIVE')");
    const [fixtureVariant] = await setup.query<mysql.ResultSetHeader>("INSERT INTO product_variants (product_id, title, sku, price_pence, is_default) VALUES (?, '100 ml', 'TIKTOK-HTTP', 4500, 1)", [fixtureProduct.insertId]);
    const productView = await collectTikTok({ name: "ViewContent", eventId: randomUUID(), path: "/products/tiktok-http-fixture", items: [{ slug: "tiktok-http-fixture", quantity: 2 }] });
    const productEvent = await productView.json();
    check(productView.ok && productEvent.data.value === 90 && productEvent.data.contents[0].content_id === `n7_variant_${fixtureVariant.insertId}`, "TikTok commerce values and catalogue IDs resolve from the production database");
    const tiktokListeners = new Map<string, ((message: unknown) => void)[]>();
    const tiktokScripts: { src: string }[] = [], tiktokUrls: string[] = [], tiktokReplies: unknown[] = [];
    const tiktokParent = { postMessage(value: unknown) { tiktokReplies.push(value); } };
    const tiktokWindow: { parent: typeof tiktokParent; ttq?: unknown[][]; addEventListener(type: string, fn: (message: unknown) => void): void; dispatchEvent(event: Event): void } = { parent: tiktokParent, addEventListener(type, fn) { tiktokListeners.set(type, [...(tiktokListeners.get(type) ?? []), fn]); }, dispatchEvent(event) { for (const fn of tiktokListeners.get(event.type) ?? []) fn(event); } };
    const tiktokScript = tiktokHtml.match(/<script>([\s\S]*)<\/script>/)?.[1]; assert.ok(tiktokScript);
    new Script(tiktokScript).runInNewContext({ window: tiktokWindow, location: { origin }, document: { createElement() { return {}; }, head: { appendChild(value: typeof tiktokScripts[number]) { tiktokScripts.push(value); } } }, history: { replaceState(_state: unknown, _unused: string, url: string) { tiktokUrls.push(url); } }, URL, Event });
    const tiktokSend = (value: unknown, source: unknown = tiktokParent) => { for (const fn of tiktokListeners.get("message") ?? []) fn({ origin, source, data: value }); };
    check(tiktokScripts.length === 0 && JSON.stringify(tiktokReplies).includes("n7:tiktok-pixel-loaded"), "TikTok production bundle is self-contained and waits for trusted initialization");
    const tiktokInit = { type: "n7:tiktok-pixel-init", channel: tiktokChannel, pixelId: tiktokBrowser.pixelId, externalId: tiktokBrowser.externalId, matching: tiktokBrowser.matching, url: `${origin}/checkout?ttclid=public-click` };
    tiktokSend(tiktokInit, {}); check(tiktokScripts.length === 0, "A foreign message source cannot load TikTok");
    tiktokSend(tiktokInit);
    check(tiktokScripts.length === 1 && tiktokScripts[0].src.includes("analytics.tiktok.com/i18n/pixel/events.js") && tiktokUrls[0] === "/checkout?ttclid=public-click", "TikTok initializes the official SDK at a fixed public URL");
    const tiktokReady = tiktokWindow.ttq?.find(call => call[0] === "ready")?.[1];
    check(typeof tiktokReady === "function", "Production SDK callback survives serialization");
    if (typeof tiktokReady === "function") tiktokReady();
    tiktokSend({ type: "n7:tiktok-pixel-event", channel: tiktokChannel, event: tiktokBrowser });
    check(tiktokWindow.ttq?.filter(call => call[0] === "track").length === 1 && JSON.stringify(tiktokReplies).includes("n7:tiktok-pixel-queued"), "Production Pixel queues the explicit event with acknowledgment");
    const matching = await fetch(`${origin}/api/meta/matching`, { method: "POST", headers: { cookie, origin, "Content-Type": "application/json" }, body: JSON.stringify(input) });
    check(matching.ok && matching.status !== 204, "Granted matching is accepted by the production route");
    const profile = await matching.json();
    check(profile.externalId === configResponse.externalId && profile.matching.em === hashMetaValue("synthetic@example.test") && profile.matching.ph === hashMetaValue("447123456789") && profile.matching.st, "Matching uses the same identity and all canonical contact hashes");
    const init = { type: "n7:meta-pixel-init", channel, pixelId, externalId: profile.externalId, matching: profile.matching, url: `${origin}/checkout?utm_campaign=synthetic` };
    handler({ origin, source: parent, data: init });
    check(scripts.length === 1 && scripts[0].src === "https://connect.facebook.net/en_US/fbevents.js", "Built runtime loads only the official SDK after the authorized handshake");
    check(urls[0] === "/checkout?utm_campaign=synthetic", "Pixel uses the real public page URL without the frame channel");
    const event = await fetch(`${origin}/api/meta/events`, { method: "POST", headers: { cookie, origin, "Content-Type": "application/json" }, body: JSON.stringify({ name: "PageView", eventId: randomUUID(), path: "/checkout" }) });
    const browserEvent = await event.json();
    check(event.ok && JSON.stringify(browserEvent.matching) === JSON.stringify(profile.matching), "The next real event response carries the full synchronized matching profile");
    check((await fetch(`${origin}/api/meta/matching`, { method: "POST", headers: { cookie, origin: "https://foreign.test", "Content-Type": "application/json" }, body: JSON.stringify(input) })).status === 403, "A foreign origin cannot update the profile");
    await save({ ...settings, pixelEnabled: false });
    check((await get(cookie)).status === 204, "Disabling Pixel blocks new SDK documents without a redeploy");
    check((await getTikTok(cookie)).status === 200, "TikTok remains available with permission when Meta Pixel is disabled");
    await setup.query("UPDATE site_settings SET value_json = ? WHERE setting_key = 'tiktok.configuration'", [JSON.stringify({ ...defaultTikTokSettings, testEventCode: "TEST_FIXTURE" })]);
    check((await getTikTok(cookie)).status === 204, "Server test mode pauses live browser SDK loading");
    await setup.query("UPDATE site_settings SET value_json = ? WHERE setting_key = 'tiktok.configuration'", [JSON.stringify({ ...defaultTikTokSettings, serverEnabled: false })]);
    await save(settings);
    const withdrawn = await fetch(`${origin}/api/meta/consent`, { method: "POST", headers: { cookie, origin, "Content-Type": "application/json" }, body: '{"granted":false}' });
    check(withdrawn.ok && (await get(cookie)).status === 204, "Server-side withdrawal prevents subsequent Pixel documents");
    check((await getTikTok(cookie)).status === 204, "Server-side withdrawal also prevents subsequent TikTok documents");
    check((await collectTikTok(tiktokEventInput)).status === 204, "Withdrawal blocks TikTok event collection");
    check((await fetch(`${origin}/api/meta/events`, { method: "POST", headers: { cookie, origin, "Content-Type": "application/json" }, body: JSON.stringify({ name: "PageView", eventId: randomUUID(), path: "/checkout" }) })).status === 204, "Withdrawal also blocks event collection");
    console.log(`${checks} production Meta/TikTok route checks passed; no browser, external advertising/Stripe calls or customer records used.`);
  } finally {
    if (server && server.exitCode === null) { const exited = once(server, "exit"); server.kill(); await exited; }
    if (created) await setup.query(`DROP DATABASE \`${database}\``);
    await setup.end();
  }
}

run().catch(error => { console.error(error instanceof Error ? error.message : "Production Meta route verification failed."); process.exitCode = 1; });
