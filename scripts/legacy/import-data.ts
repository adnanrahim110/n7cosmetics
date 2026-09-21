import type { Connection, RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { readSource } from "./archive";
import { normalizedEmail, pence, phpValue, sourceDate, type LegacyRow } from "../../lib/legacy/format";
import { createHash } from "node:crypto";

const tables = ["posts", "postmeta", "users", "usermeta", "comments", "commentmeta", "wc_orders", "wc_orders_meta", "wc_order_addresses", "wc_order_operational_data", "wc_customer_lookup", "woocommerce_order_items", "woocommerce_order_itemmeta", "terms", "term_taxonomy", "term_relationships", "termmeta", "woocommerce_attribute_taxonomies", "options", "e_submissions", "e_submissions_values", "yith_wcwl", "yith_wcwl_lists", "tinvwl_items", "tinvwl_lists", "woocommerce_shipping_zones", "woocommerce_shipping_zone_locations", "woocommerce_shipping_zone_methods"] as const;
type Table = typeof tables[number];
type Data = Record<Table, LegacyRow[]>;
type Meta = Map<string, LegacyRow[]>;
type Product = RowDataPacket & { id: string; slug: string; name: string; product_code: string | null; variant_id: string | null; sku: string | null; price_pence: number; stock_on_hand: number; track_inventory: number };
type ProductMatch = { old: LegacyRow; current: Product | null; reason: string | null };
const group = (rows: LegacyRow[], key: string): Meta => {
  const result: Meta = new Map();
  for (const row of rows) { const id = row[key] ?? ""; const values = result.get(id) ?? []; values.push(row); result.set(id, values); }
  return result;
};
const index = (rows: LegacyRow[], key: string) => new Map(rows.map(row => [row[key] ?? "", row]));
const json = (value: unknown) => JSON.stringify(value);
function meta(rows: LegacyRow[] | undefined, key: string): string | null {
  return rows?.findLast(row => row.meta_key === key)?.meta_value ?? null;
}
function decode(value: string | null | undefined): unknown { try { return phpValue(value); } catch { return value ?? null; } }
function object(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
const name = (row: LegacyRow) => [row.first_name, row.last_name].filter(Boolean).join(" ");
const bool = (value: string | null | undefined) => ["yes", "1", "true"].includes(value ?? "");

async function insert(db: Connection, table: string, data: Record<string, string | number | boolean | null | undefined>): Promise<string> {
  if (!/^[a-z][a-z0-9_]*$/.test(table) || Object.keys(data).some(key => !/^[a-z][a-z0-9_]*$/.test(key))) throw new Error("Invalid destination identifier.");
  const columns = Object.keys(data);
  const [result] = await db.execute<ResultSetHeader>(`INSERT INTO ${table} (${columns.join(",")}) VALUES (${columns.map(() => "?").join(",")})`, columns.map(key => data[key] ?? null));
  return String(result.insertId);
}

export async function loadImport(db: Connection, batchId: string) {
  const data = {} as Data;
  for (const table of tables) data[table] = await readSource(db, batchId, `bc_${table}`);
  const [products] = await db.query<Product[]>(`SELECT CAST(p.id AS CHAR) id,p.slug,p.name,p.product_code,p.track_inventory,
    CAST(v.id AS CHAR) variant_id,v.sku,v.price_pence,v.stock_on_hand FROM products p
    LEFT JOIN product_variants v ON v.id=(SELECT v2.id FROM product_variants v2 WHERE v2.product_id=p.id ORDER BY v2.is_default DESC,v2.id LIMIT 1)`);
  const postMeta = group(data.postmeta, "post_id");
  const matches: ProductMatch[] = data.posts.filter(row => ["product", "product_variation"].includes(row.post_type ?? "")).map(old => {
    const exact = products.filter(product => product.slug === old.post_name);
    // Never guess by similar product names or import draft duplicates over published products.
    return { old, current: exact.length === 1 && old.post_type === "product" ? exact[0] : null, reason: exact.length === 1 && old.post_type === "product" ? "Exact slug" : null };
  });
  const duplicates = matches.filter(match => match.current && matches.filter(other => other.current?.id === match.current?.id).length > 1);
  if (duplicates.length) throw new Error("Multiple legacy products match the same current product; resolve before importing.");
  const orders = data.wc_orders.filter(row => row.type === "shop_order");
  const refunds = data.wc_orders.filter(row => row.type === "shop_order_refund");
  const reviews = data.comments.filter(row => row.comment_type === "review");
  const matched = new Set(matches.filter(match => match.current).map(match => match.old.ID));
  const report = {
    sourceOrders: orders.length, sourceRefunds: refunds.length, sourceReviews: reviews.length,
    sourceOrderTotalPence: orders.reduce((total, row) => total + pence(row.total_amount), 0),
    sourceRefundTotalPence: refunds.reduce((total, row) => total + Math.abs(pence(row.total_amount)), 0),
    productMatches: matches.filter(match => match.current).map(match => ({ oldId: match.old.ID, productId: match.current!.id, name: match.current!.name, method: match.reason })),
    unmatchedProducts: matches.filter(match => !match.current).map(match => ({ oldId: match.old.ID, name: match.old.post_title, status: match.old.post_status })),
    unmatchedReviews: reviews.filter(row => !matched.has(row.comment_post_ID)).length,
    orphanOrderNotes: data.comments.filter(row => row.comment_type === "order_note" && !orders.some(order => order.id === row.comment_post_ID)).length,
    originalContentPreserved: true,
  };
  // Product metadata can contain conflicting old values. Retain all values and fail on price conflicts.
  for (const match of matches.filter(row => row.current)) {
    if (!match.current!.variant_id) throw new Error(`Matched product ${match.current!.id} has no variant.`);
    const prices = new Set((postMeta.get(match.old.ID!) ?? []).filter(row => row.meta_key === "_price" && row.meta_value !== "").map(row => row.meta_value));
    if (prices.size > 1) throw new Error(`Conflicting source prices on product ${match.old.ID}.`);
  }
  return { data, products, postMeta, matches, orders, refunds, reviews, report };
}
type Loaded = Awaited<ReturnType<typeof loadImport>>;

async function importProducts(db: Connection, batchId: string, loaded: Loaded) {
  const { data, postMeta, matches } = loaded;
  const termById = index(data.terms, "term_id");
  const taxonomies = index(data.term_taxonomy, "term_taxonomy_id");
  const relationships = group(data.term_relationships, "object_id");
  for (const match of matches) {
    const oldId = match.old.ID!;
    const metadata = postMeta.get(oldId) ?? [];
    const classifications = (relationships.get(oldId) ?? []).map(row => { const tax = taxonomies.get(row.term_taxonomy_id!); return { relationship: row, taxonomy: tax, term: tax ? termById.get(tax.term_id!) : null }; });
    await insert(db, "legacy_products", { legacy_id: oldId, import_id: batchId, product_id: match.current?.id, variant_id: match.current?.variant_id, name: match.old.post_title ?? "", slug: match.old.post_name ?? "", original_status: match.old.post_status ?? "", match_method: match.reason, details_json: json({ post: match.old, metadata, classifications }) });
    if (!match.current) continue;
    const priceValue = meta(metadata, "_price");
    const price = priceValue === null || priceValue === "" ? Number(match.current.price_pence) : pence(priceValue);
    const regular = pence(meta(metadata, "_regular_price"));
    const sku = meta(metadata, "_sku")?.trim() || match.current.sku;
    const rawStock = meta(metadata, "_stock");
    const stock = rawStock === null || rawStock === "" ? Number(match.current.stock_on_hand) : Number(rawStock);
    if (!Number.isSafeInteger(stock) || price < 0) throw new Error(`Unsupported inventory or price for product ${oldId}.`);
    const manageStock = meta(metadata, "_manage_stock");
    await db.execute(`UPDATE product_variants SET sku=?,price_pence=?,compare_at_price_pence=?,stock_on_hand=?,legacy_attributes_json=?,legacy_inventory_json=? WHERE id=?`, [sku, price, regular > price ? regular : null, stock, json({ attributes: decode(meta(metadata, "_product_attributes")), classifications }), json({ quantity: rawStock, stock_status: meta(metadata, "_stock_status"), manage_stock: manageStock, backorders: meta(metadata, "_backorders") }), match.current.variant_id]);
    await db.execute("UPDATE products SET track_inventory = ? WHERE id = ?", [manageStock === null ? match.current.track_inventory : Number(manageStock === "yes"), match.current.id]);
    match.current.sku = sku;
  }
  const byOld = new Map(matches.filter(match => match.current).map(match => [match.old.ID!, match.current!]));
  for (const match of matches.filter(match => match.current)) {
    const bundle = object(decode(meta(postMeta.get(match.old.ID!), "_yith_wcpb_bundle_data")));
    if (!Object.keys(bundle).length) continue;
    const components = Object.values(bundle).map(value => object(value));
    if (components.some(component => !byOld.get(String(component.product_id))?.variant_id)) throw new Error(`Bundle ${match.old.ID} has an unmapped component.`);
    await db.execute("DELETE FROM bundle_items WHERE bundle_product_id = ?", [match.current!.id]);
    for (const component of components) await insert(db, "bundle_items", { bundle_product_id: match.current!.id, component_variant_id: byOld.get(String(component.product_id))!.variant_id, quantity: Number(component.bp_quantity), sort_order: Number(component.bundle_order) });
  }
  return byOld;
}

async function importCustomers(db: Connection, batchId: string, loaded: Loaded) {
  const { data, orders } = loaded;
  const userMeta = group(data.usermeta, "user_id");
  const users = index(data.users, "ID");
  const addresses = group(data.wc_order_addresses, "order_id");
  type Profile = { email: string | null; full_name: string; phone: string | null; country_code: string | null; registered_at: string | null; last_active_at: string | null; created_at: string; links: { table: string; id: string }[] };
  const profiles = new Map<string, Profile>();
  const staff = new Set(data.users.filter(user => !meta(userMeta.get(user.ID!), "bc_capabilities")?.includes('"customer"')).map(user => user.ID));
  function add(table: string, id: string, email: string | null, fullName: string, phone: string | null, country: string | null, registered: string | null, lastActive: string | null, occurred: string | null) {
    const normalized = normalizedEmail(email);
    const key = normalized || `${table}:${id}`;
    const profile = profiles.get(key) ?? { email: normalized, full_name: fullName, phone, country_code: country || null, registered_at: registered, last_active_at: lastActive, created_at: occurred || registered || "2026-09-17 13:49:00", links: [] };
    if (fullName) profile.full_name = fullName;
    if (phone) profile.phone = phone;
    if (country) profile.country_code = country;
    if (registered && (!profile.registered_at || registered < profile.registered_at)) profile.registered_at = registered;
    if (lastActive && (!profile.last_active_at || lastActive > profile.last_active_at)) profile.last_active_at = lastActive;
    if (occurred && occurred < profile.created_at) profile.created_at = occurred;
    profile.links.push({ table, id }); profiles.set(key, profile);
  }
  for (const user of data.users) {
    if (staff.has(user.ID)) continue;
    const fields = userMeta.get(user.ID!) ?? [];
    const fullName = [meta(fields, "first_name"), meta(fields, "last_name")].filter(Boolean).join(" ") || user.display_name || "";
    add("bc_users", user.ID!, user.user_email, fullName, meta(fields, "billing_phone"), meta(fields, "billing_country"), sourceDate(user.user_registered), null, sourceDate(user.user_registered));
  }
  for (const row of data.wc_customer_lookup) {
    if (row.user_id && staff.has(row.user_id)) continue;
    add("bc_wc_customer_lookup", row.customer_id!, row.email, name(row), null, row.country, sourceDate(row.date_registered), sourceDate(row.date_last_active), sourceDate(row.date_registered));
  }
  for (const row of [...orders].sort((a, b) => (a.date_created_gmt ?? "").localeCompare(b.date_created_gmt ?? ""))) {
    const billing = addresses.get(row.id!)?.find(address => address.address_type === "billing") ?? {};
    add("bc_wc_orders", row.id!, row.billing_email, name(billing), billing.phone, billing.country, null, null, sourceDate(row.date_created_gmt));
  }
  const byOrder = new Map<string, string>(), byUser = new Map<string, string>();
  for (const profile of profiles.values()) {
    const [existing] = profile.email ? await db.execute<RowDataPacket[]>("SELECT CAST(id AS CHAR) id FROM customers WHERE email=?", [profile.email]) : [[]];
    const customerId = existing[0]?.id as string | undefined ?? await insert(db, "customers", { email: profile.email, full_name: profile.full_name, phone: profile.phone, country_code: profile.country_code, source: "LEGACY", import_id: batchId, registered_at: profile.registered_at, last_active_at: profile.last_active_at, created_at: profile.created_at });
    for (const link of profile.links) {
      await insert(db, "legacy_customer_links", { source_table: link.table, source_id: link.id, customer_id: customerId, import_id: batchId });
      if (link.table === "bc_wc_orders") byOrder.set(link.id, customerId);
      if (link.table === "bc_users") byUser.set(link.id, customerId);
    }
  }
  // Account address books are distinct from immutable addresses on historic orders.
  for (const [userId, customerId] of byUser) {
    const fields = userMeta.get(userId);
    for (const kind of ["billing", "shipping"]) {
      const get = (key: string) => meta(fields, `${kind}_${key}`);
      if (!get("address_1")) continue;
      await db.execute(`INSERT INTO customer_addresses (customer_id,address_type,full_name,company,line_1,line_2,city,region,postal_code,country_code,phone,email,source) VALUES (?,?,?,?,?,?,?,?,?,?,?,?, 'LEGACY') ON DUPLICATE KEY UPDATE customer_id=VALUES(customer_id)`, [customerId, kind.toUpperCase(), [get("first_name"), get("last_name")].filter(Boolean).join(" "), get("company"), get("address_1"), get("address_2"), get("city") ?? "", get("state"), get("postcode") ?? "", get("country"), get("phone"), get("email") || users.get(userId)?.user_email || null]);
    }
  }
  return { byOrder, byUser, count: profiles.size };
}

async function importOrders(db: Connection, batchId: string, loaded: Loaded, products: Map<string, Product>, customers: Awaited<ReturnType<typeof importCustomers>>) {
  const { data, orders, refunds } = loaded;
  const orderMeta = group(data.wc_orders_meta, "order_id"), operational = index(data.wc_order_operational_data, "order_id");
  const addresses = group(data.wc_order_addresses, "order_id"), items = group(data.woocommerce_order_items, "order_id"), itemMeta = group(data.woocommerce_order_itemmeta, "order_item_id");
  const refundsByOrder = group(refunds, "parent_order_id");
  const statusMap: Record<string, string> = { "wc-completed": "COMPLETED", "wc-processing": "PROCESSING", "wc-refunded": "REFUNDED", "wc-cancelled": "CANCELLED", "wc-failed": "FAILED", "wc-pending": "NEW", "wc-on-hold": "ON_HOLD" };
  const orderIds = new Map<string, string>(), itemIds = new Map<string, string>();
  for (const old of orders) {
    const oldId = old.id!;
    const operation = operational.get(oldId) ?? {}, metadata = orderMeta.get(oldId) ?? [];
    const billing = addresses.get(oldId)?.find(address => address.address_type === "billing") ?? {};
    const orderItems = items.get(oldId) ?? [];
    const lines = orderItems.filter(item => item.order_item_type === "line_item");
    const shipping = orderItems.filter(item => item.order_item_type === "shipping");
    const usedCoupons = orderItems.filter(item => item.order_item_type === "coupon");
    const total = pence(old.total_amount);
    const refunded = (refundsByOrder.get(oldId) ?? []).reduce((sum, refund) => sum + Math.abs(pence(refund.total_amount)), 0);
    const paid = Boolean(sourceDate(operation.date_paid_gmt)) || bool(meta(metadata, "_stripe_charge_captured")) || old.status === "wc-completed" || old.status === "wc-refunded";
    const paymentStatus = refunded > 0 ? (refunded >= total ? "REFUNDED" : "PARTIALLY_REFUNDED") : paid ? "PAID" : old.status === "wc-failed" ? "FAILED" : old.status === "wc-cancelled" ? "UNPAID" : "PENDING";
    const [numberCollision] = await db.execute<RowDataPacket[]>("SELECT id FROM orders WHERE order_number=?", [oldId]);
    const orderId = await insert(db, "orders", { order_number: numberCollision.length ? `WP-${oldId}` : oldId, status: statusMap[old.status!] || "ON_HOLD", payment_status: paymentStatus, fulfillment_status: old.status === "wc-completed" ? "FULFILLED" : "UNFULFILLED", currency: old.currency, customer_id: customers.byOrder.get(oldId), customer_email: old.billing_email ?? "", customer_name: name(billing), customer_phone: billing.phone, subtotal_pence: lines.reduce((sum, item) => sum + pence(meta(itemMeta.get(item.order_item_id!), "_line_subtotal")), 0), discount_pence: pence(operation.discount_total_amount), shipping_pence: pence(operation.shipping_total_amount), tax_pence: pence(old.tax_amount), total_pence: total, coupon_code: usedCoupons.map(item => item.order_item_name).join(", ") || null, customer_notes: old.customer_note, payment_provider: old.payment_method?.toUpperCase() || null, payment_reference: old.transaction_id || meta(metadata, "_stripe_intent_id"), paid_at: sourceDate(operation.date_paid_gmt), placed_at: sourceDate(old.date_created_gmt), updated_at: sourceDate(old.date_updated_gmt) || sourceDate(old.date_created_gmt), completed_at: sourceDate(operation.date_completed_gmt), shipping_method_name: shipping.map(item => item.order_item_name).join(", ") || null, source: "LEGACY", legacy_id: oldId, import_id: batchId, original_status: old.status, legacy_details_json: json({ order: old, operational: operation, metadata }) });
    orderIds.set(oldId, orderId);
    for (const address of addresses.get(oldId) ?? []) await insert(db, "order_addresses", { order_id: orderId, address_type: address.address_type!.toUpperCase(), full_name: name(address), company: address.company, line_1: address.address_1 ?? "", line_2: address.address_2, city: address.city ?? "", region: address.state, postal_code: address.postcode ?? "", country_code: address.country || "", phone: address.phone, email: address.email });
    for (const item of lines) {
      const fields = itemMeta.get(item.order_item_id!) ?? [];
      const productId = meta(fields, "_product_id"), variationId = meta(fields, "_variation_id");
      const product = products.get(variationId || "") ?? products.get(productId || "");
      const quantity = Number(meta(fields, "_qty"));
      if (!Number.isInteger(quantity) || quantity <= 0) throw new Error(`Unsupported quantity in source item ${item.order_item_id}.`);
      const subtotal = pence(meta(fields, "_line_subtotal")), lineTotal = pence(meta(fields, "_line_total"));
      const id = await insert(db, "order_items", { order_id: orderId, product_id: product?.id, variant_id: product?.variant_id, product_name: item.order_item_name ?? "", variant_title: meta(fields, "pa_volume") ?? "", sku: product?.sku ?? "", unit_price_pence: Math.round(subtotal / quantity), quantity, discount_pence: Math.max(0, subtotal - lineTotal), line_total_pence: lineTotal, subtotal_pence: subtotal, tax_pence: pence(meta(fields, "_line_tax")), created_at: sourceDate(old.date_created_gmt), legacy_id: item.order_item_id, legacy_product_id: productId || null, legacy_variation_id: variationId && variationId !== "0" ? variationId : null, legacy_details_json: json({ item, metadata: fields }) });
      itemIds.set(item.order_item_id!, id);
    }
    for (const item of orderItems.filter(item => item.order_item_type !== "line_item")) {
      const fields = itemMeta.get(item.order_item_id!) ?? [];
      const isCoupon = item.order_item_type === "coupon";
      await insert(db, "order_adjustments", { order_id: orderId, legacy_id: item.order_item_id, adjustment_type: item.order_item_type, name: item.order_item_name ?? "", amount_pence: pence(meta(fields, isCoupon ? "discount_amount" : "cost")), tax_pence: pence(meta(fields, isCoupon ? "discount_amount_tax" : "total_tax")), details_json: json({ item, metadata: fields }) });
    }
    await insert(db, "payments", { order_id: orderId, provider: old.payment_method?.toUpperCase() || "UNKNOWN", provider_reference: old.transaction_id || meta(metadata, "_stripe_intent_id"), payment_type: "CHARGE", status: paid ? "SUCCEEDED" : old.status === "wc-failed" ? "FAILED" : old.status === "wc-cancelled" ? "CANCELLED" : "PENDING", amount_pence: total, currency: old.currency, provider_payload_json: json({ metadata, transaction_id: old.transaction_id }), processed_at: sourceDate(operation.date_paid_gmt), created_at: sourceDate(old.date_created_gmt), source: "LEGACY", legacy_key: `order:${oldId}`, fee_pence: meta(metadata, "_stripe_fee") === null ? null : pence(meta(metadata, "_stripe_fee")), net_pence: meta(metadata, "_stripe_net") === null ? null : pence(meta(metadata, "_stripe_net")) });
  }
  for (const item of data.woocommerce_order_items.filter(item => itemIds.has(item.order_item_id!))) {
    const parent = meta(itemMeta.get(item.order_item_id!), "_bundled_by");
    if (parent && itemIds.has(parent)) await db.execute("UPDATE order_items SET parent_item_id=? WHERE id=?", [itemIds.get(parent)!, itemIds.get(item.order_item_id!)!]);
  }
  for (const refund of refunds) {
    const orderId = orderIds.get(refund.parent_order_id!);
    if (!orderId) throw new Error(`Refund ${refund.id} has no source order.`);
    const fields = orderMeta.get(refund.id!) ?? [], operation = operational.get(refund.id!) ?? {};
    const amount = Math.abs(pence(refund.total_amount));
    const refundId = await insert(db, "order_refunds", { order_id: orderId, legacy_id: refund.id, source: "LEGACY", amount_pence: amount, tax_pence: Math.abs(pence(refund.tax_amount)), shipping_pence: Math.abs(pence(operation.shipping_total_amount)), currency: refund.currency, reason: meta(fields, "_refund_reason"), provider_reference: meta(fields, "_stripe_refund_id"), payment_refunded: bool(meta(fields, "_refunded_payment")), created_at: sourceDate(refund.date_created_gmt), details_json: json({ refund, metadata: fields, operational: operation }) });
    await insert(db, "payments", { order_id: orderId, provider: meta(fields, "_stripe_refund_id") ? "STRIPE" : "MANUAL", provider_reference: meta(fields, "_stripe_refund_id"), payment_type: "REFUND", status: "SUCCEEDED", amount_pence: amount, currency: refund.currency, processed_at: sourceDate(refund.date_created_gmt), created_at: sourceDate(refund.date_created_gmt), source: "LEGACY", legacy_key: `refund:${refund.id}` });
    for (const item of items.get(refund.id!) ?? []) {
      const fields = itemMeta.get(item.order_item_id!) ?? [];
      await insert(db, "order_refund_items", { refund_id: refundId, order_item_id: itemIds.get(meta(fields, "_refunded_item_id") ?? ""), legacy_id: item.order_item_id, item_type: item.order_item_type, name: item.order_item_name ?? "", quantity: Number(meta(fields, "_qty") || 0), amount_pence: pence(meta(fields, item.order_item_type === "shipping" ? "cost" : "_line_total")), tax_pence: pence(meta(fields, item.order_item_type === "shipping" ? "total_tax" : "_line_tax")), details_json: json({ item, metadata: fields }) });
    }
  }
  const commentMeta = group(data.commentmeta, "comment_id");
  for (const note of data.comments.filter(row => row.comment_type === "order_note")) {
    const orderId = orderIds.get(note.comment_post_ID!);
    if (!orderId) continue; // Unlinked source notes remain fully available in the archive.
    await insert(db, "order_status_history", { order_id: orderId, status: "NOTE", note: note.comment_content, created_at: sourceDate(note.comment_date_gmt) || sourceDate(note.comment_date), source: "LEGACY", legacy_id: note.comment_ID, is_customer_visible: bool(meta(commentMeta.get(note.comment_ID!), "is_customer_note")) });
  }
  return { orderIds, itemIds };
}

async function importReviewsAndEnquiries(db: Connection, batchId: string, loaded: Loaded, products: Map<string, Product>) {
  const { data, reviews } = loaded;
  const fields = group(data.commentmeta, "comment_id");
  for (const review of reviews) {
    const rating = Number(meta(fields.get(review.comment_ID!), "rating"));
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error(`Invalid source review rating: ${review.comment_ID}.`);
    const date = sourceDate(review.comment_date_gmt) || sourceDate(review.comment_date);
    await insert(db, "product_reviews", { product_id: products.get(review.comment_post_ID!)?.id, status: review.comment_approved === "1" ? "PUBLISHED" : review.comment_approved === "0" ? "PENDING" : "REJECTED", rating, reviewer_name: review.comment_author ?? "", reviewer_email: review.comment_author_email ?? "", title: "", body: review.comment_content ?? "", recommends_product: 0, is_verified_purchase: bool(meta(fields.get(review.comment_ID!), "verified")), ip_address: review.comment_author_IP ?? "", user_agent: review.comment_agent, published_at: review.comment_approved === "1" ? date : null, submitted_at: date, updated_at: date, source: "LEGACY", legacy_id: review.comment_ID, legacy_product_id: review.comment_post_ID, import_id: batchId });
  }
  const formValues = group(data.e_submissions_values, "submission_id");
  for (const submission of data.e_submissions) {
    const values = formValues.get(submission.id!) ?? [];
    const get = (key: string) => values.find(row => row.key === key)?.value ?? "";
    await insert(db, "contact_enquiries", { name: get("name"), email: get("email"), topic: "Imported contact enquiry", message: get("message"), status: "NEW", created_at: sourceDate(submission.created_at_gmt) || sourceDate(submission.created_at), source: "LEGACY", legacy_id: submission.id, import_id: batchId });
  }
}

async function importCoupons(db: Connection, loaded: Loaded, orderIds: Map<string, string>) {
  const { data, postMeta, orders } = loaded;
  const couponPosts = data.posts.filter(row => row.post_type === "shop_coupon");
  const definitions = new Map(couponPosts.map(row => [row.post_title!.toUpperCase(), row]));
  const usages = data.woocommerce_order_items.filter(row => row.order_item_type === "coupon");
  const codes = new Set([...definitions.keys(), ...usages.map(row => row.order_item_name!.toUpperCase())]);
  const orderById = index(orders, "id"), itemMeta = group(data.woocommerce_order_itemmeta, "order_item_id");
  for (const code of codes) {
    const post = definitions.get(code), fields = post ? postMeta.get(post.ID!) : undefined;
    const [existing] = await db.execute<RowDataPacket[]>("SELECT CAST(id AS CHAR) id FROM coupons WHERE code=?", [code]);
    const type = meta(fields, "discount_type"), value = meta(fields, "coupon_amount");
    const expires = meta(fields, "date_expires");
    // A historical definition is preserved inactive until a manager explicitly enables it.
    const discountId = !existing.length ? await insert(db, "discounts", { name: `Imported ${code}`, method: "COUPON", discount_type: type === "percent" ? "PERCENTAGE" : bool(meta(fields, "free_shipping")) ? "FREE_SHIPPING" : "FIXED_AMOUNT", value: type === "percent" ? Number(value || 0) : Math.max(0, pence(value)), applies_to: "ALL", ends_at: expires && Number(expires) > 0 ? new Date(Number(expires) * 1000).toISOString().slice(0, 19).replace("T", " ") : null, is_active: 0 }) : null;
    const couponId = existing[0]?.id as string | undefined ?? await insert(db, "coupons", { discount_id: discountId, code, usage_limit: Number(meta(fields, "usage_limit")) || null, per_email_limit: Number(meta(fields, "usage_limit_per_user")) || null, used_count: Math.max(Number(meta(fields, "usage_count")) || 0, usages.filter(item => item.order_item_name!.toUpperCase() === code).length), is_active: 0, source: "LEGACY", legacy_id: post?.ID });
    for (const item of usages.filter(row => row.order_item_name!.toUpperCase() === code)) {
      await insert(db, "coupon_redemptions", { coupon_id: couponId, order_id: orderIds.get(item.order_id!), customer_email: orderById.get(item.order_id!)?.billing_email || "", discount_pence: pence(meta(itemMeta.get(item.order_item_id!), "discount_amount")), redeemed_at: sourceDate(orderById.get(item.order_id!)?.date_created_gmt) });
    }
  }
}

async function importSavedLists(db: Connection, loaded: Loaded, products: Map<string, Product>, users: Map<string, string>) {
  const { data } = loaded;
  for (const provider of ["yith", "tinv"] as const) {
    const lists = provider === "yith" ? data.yith_wcwl_lists : data.tinvwl_lists;
    const items = provider === "yith" ? data.yith_wcwl : data.tinvwl_items;
    const ids = new Map<string, string>();
    for (const list of lists) ids.set(list.ID!, await insert(db, "customer_wishlists", { customer_id: users.get((list.user_id || list.author) ?? ""), legacy_key: `${provider}:${list.ID}`, name: list.wishlist_name || list.title || "Wishlist", privacy: list.wishlist_privacy || list.status, created_at: sourceDate(list.dateadded || list.date), details_json: json(list), source: "LEGACY" }));
    for (const item of items) {
      const oldProductId = item.prod_id || item.product_id;
      await insert(db, "customer_wishlist_items", { wishlist_id: ids.get(item.wishlist_id!), product_id: products.get(oldProductId!)?.id, legacy_key: `${provider}:${item.ID}`, legacy_product_id: oldProductId, quantity: Number(item.quantity || 1), created_at: sourceDate(item.dateadded || item.date), details_json: json(item) });
    }
  }
  for (const cart of data.usermeta.filter(row => row.meta_key === "_woocommerce_persistent_cart_1")) {
    await insert(db, "customer_saved_carts", { customer_id: users.get(cart.user_id!), legacy_key: `usermeta:${cart.umeta_id}`, contents_json: json({ serialized: cart.meta_value, decoded: decode(cart.meta_value) }), source: "LEGACY" });
  }
}

async function importShipping(db: Connection, loaded: Loaded) {
  const options = new Map(loaded.data.options.map(row => [row.option_name!, row.option_value]));
  const [zones] = await db.query<RowDataPacket[]>("SELECT z.id FROM shipping_zones z JOIN shipping_zone_countries c ON c.zone_id=z.id WHERE c.country_code='GB' ORDER BY z.sort_order,z.id LIMIT 1");
  const zoneId = zones[0]?.id as string | undefined ?? await insert(db, "shipping_zones", { name: "United Kingdom", is_active: 1, sort_order: 0 });
  await db.execute("INSERT IGNORE INTO shipping_zone_countries (zone_id,country_code) VALUES (?, 'GB')", [zoneId]);
  const flat = object(decode(options.get("woocommerce_flat_rate_7_settings")));
  const free = object(decode(options.get("woocommerce_free_shipping_2_settings")));
  const [methods] = await db.execute<RowDataPacket[]>("SELECT m.id FROM shipping_methods m JOIN shipping_method_rates r ON r.method_id=m.id WHERE r.zone_id=? AND m.method_type='DELIVERY' ORDER BY m.id LIMIT 1", [zoneId]);
  const price = pence(String(flat.cost ?? "2.99"));
  const methodId = methods.length ? String(methods[0].id) : await insert(db, "shipping_methods", { name: "Standard delivery", method_type: "DELIVERY", price_pence: price, legacy_id: 7, allow_free_shipping_coupon: 1 });
  await db.execute("UPDATE shipping_methods SET price_pence=?,pricing_mode='FLAT_RATE',legacy_id=7,is_active=1,sort_order=10 WHERE id=?", [price, methodId]);
  await db.execute("INSERT INTO shipping_method_rates (method_id,zone_id,price_pence) VALUES (?,?,?) ON DUPLICATE KEY UPDATE price_pence=VALUES(price_pence)", [methodId, zoneId, price]);
  const [existingRules] = await db.query<RowDataPacket[]>("SELECT id FROM shipping_rules WHERE legacy_id=2 LIMIT 1");
  const ruleId = existingRules.length ? String(existingRules[0].id) : await insert(db, "shipping_rules", { name: "Free Standard delivery", minimum_subtotal_pence: pence(String(free.min_amount ?? "99.00")), threshold_basis: free.ignore_discounts === "yes" ? "BEFORE_DISCOUNT" : "AFTER_DISCOUNT", zone_id: zoneId, legacy_id: 2 });
  await db.execute("UPDATE shipping_rules SET minimum_subtotal_pence=?,threshold_basis=?,zone_id=?,is_active=1 WHERE id=?", [pence(String(free.min_amount ?? "99.00")), free.ignore_discounts === "yes" ? "BEFORE_DISCOUNT" : "AFTER_DISCOUNT", zoneId, ruleId]);
  await db.execute("INSERT IGNORE INTO shipping_rule_methods (rule_id,method_id) VALUES (?,?)", [ruleId, methodId]);
}

export async function applyImport(db: Connection, batchId: string, loaded: Loaded) {
  const [batches] = await db.execute<RowDataPacket[]>("SELECT status FROM legacy_imports WHERE id=?", [batchId]);
  if (batches[0]?.status === "COMPLETE") { console.log("This backup is already imported; no records changed."); return; }
  if (batches[0]?.status !== "READY") throw new Error("Source archive must be verified before importing.");
  await db.beginTransaction();
  try {
    const contentHash = async () => {
      const snapshots = [];
      for (const sql of ["SELECT id,name,slug,short_description,description,brand,inspired_by,audience,fragrance_notes_json,featured,seo_title,seo_description,published_at,status FROM products ORDER BY id", "SELECT * FROM product_images ORDER BY id", "SELECT * FROM product_videos ORDER BY id", "SELECT * FROM media_assets ORDER BY id"]) {
        const [rows] = await db.query(sql); snapshots.push(rows);
      }
      return createHash("sha256").update(json(snapshots)).digest("hex");
    };
    const originalContentHash = await contentHash();
    await db.execute("UPDATE legacy_imports SET status='IMPORTING' WHERE id=?", [batchId]);
    console.log("Matching product operations and preserving content/media...");
    const products = await importProducts(db, batchId, loaded);
    console.log("Importing customer profiles and account addresses...");
    const customers = await importCustomers(db, batchId, loaded);
    console.log("Importing orders, payment history, refunds and notes...");
    const { orderIds } = await importOrders(db, batchId, loaded, products, customers);
    console.log("Importing reviews, enquiries, coupon history and saved lists...");
    await importReviewsAndEnquiries(db, batchId, loaded, products);
    await importCoupons(db, loaded, orderIds);
    await importSavedLists(db, loaded, products, customers.byUser);
    await importShipping(db, loaded);
    if (await contentHash() !== originalContentHash) throw new Error("Existing product content or media changed; import rolled back.");
    const [counts] = await db.query<RowDataPacket[]>(`SELECT (SELECT COUNT(*) FROM orders WHERE source='LEGACY') orders, (SELECT COUNT(*) FROM product_reviews WHERE source='LEGACY') reviews, (SELECT COUNT(*) FROM order_refunds WHERE source='LEGACY') refunds, (SELECT COALESCE(SUM(total_pence),0) FROM orders WHERE source='LEGACY') total_pence, (SELECT COALESCE(SUM(amount_pence),0) FROM order_refunds WHERE source='LEGACY') refund_pence`);
    const actual = counts[0], expected = loaded.report;
    if (Number(actual.orders) !== expected.sourceOrders || Number(actual.reviews) !== expected.sourceReviews || Number(actual.refunds) !== expected.sourceRefunds || Number(actual.total_pence) !== expected.sourceOrderTotalPence || Number(actual.refund_pence) !== expected.sourceRefundTotalPence) throw new Error("Imported record counts or financial totals do not reconcile.");
    const [detailCounts] = await db.query<RowDataPacket[]>(`SELECT (SELECT COUNT(*) FROM order_items WHERE legacy_id IS NOT NULL) items, (SELECT COUNT(*) FROM order_addresses a JOIN orders o ON o.id=a.order_id WHERE o.source='LEGACY') addresses, (SELECT COUNT(*) FROM order_status_history WHERE source='LEGACY') notes, (SELECT COUNT(*) FROM contact_enquiries WHERE source='LEGACY') enquiries, (SELECT COUNT(*) FROM customer_wishlist_items) wishlist_items, (SELECT COUNT(*) FROM customer_saved_carts) saved_carts`);
    const sourceOrderIds = new Set(loaded.orders.map(row => row.id));
    const expectedItems = loaded.data.woocommerce_order_items.filter(row => row.order_item_type === "line_item" && sourceOrderIds.has(row.order_id)).length;
    if (Number(detailCounts[0].items) !== expectedItems || Number(detailCounts[0].addresses) !== loaded.data.wc_order_addresses.length || Number(detailCounts[0].enquiries) !== loaded.data.e_submissions.length) throw new Error("Detailed source record counts do not reconcile.");
    const report = { ...expected, originalContentHash, importedCustomers: customers.count, reconciliation: { ...actual, ...detailCounts[0] } };
    await db.execute("UPDATE legacy_imports SET status='COMPLETE',report_json=?,completed_at=CURRENT_TIMESTAMP(3) WHERE id=?", [json(report), batchId]);
    await db.commit();
    console.log(JSON.stringify({ importedCustomers: customers.count, reconciliation: actual, status: "COMPLETE" }));
  } catch (error) { await db.rollback(); throw error; }
}
