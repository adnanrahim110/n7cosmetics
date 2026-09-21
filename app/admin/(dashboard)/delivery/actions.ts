"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { formString, formStringList, isDatabaseId, poundsToPence } from "@/lib/admin/form";
import { parseShippingMethod, parseShippingRule, parseShippingZone, shippingRatesSchema } from "@/lib/admin/shipping";
import { writeAuditLog } from "@/lib/auth/audit";
import { getRequestMetadata } from "@/lib/auth/request";
import { requireAdministrator } from "@/lib/auth/session";
import { executeMutation, selectOne, selectRows } from "@/lib/db/query";
import { withTransaction } from "@/lib/db/transaction";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";

async function saved(entityType: string, id: string, action: string, summary: string, tab: string) {
  const [admin, metadata] = await Promise.all([requireAdministrator(["OWNER", "MANAGER"]), getRequestMetadata()]);
  await writeAuditLog({ administratorId: admin.id, action, entityType, entityId: id, summary, ipAddress: metadata.ipAddress });
  revalidatePath("/admin/shipping"); revalidatePath("/admin/delivery"); revalidatePath("/shipping-returns"); revalidatePath("/checkout");
  redirect(`/admin/shipping?tab=${tab}&saved=1`);
}
function invalid(tab: string): never { redirect(`/admin/shipping?tab=${tab}&error=${tab}`); }
async function syncZone(id: string, countries: string[], postcodes: string[], db: PoolConnection) {
  await executeMutation("DELETE FROM shipping_zone_countries WHERE zone_id=?", [id], db);
  for (const code of countries) await executeMutation("INSERT INTO shipping_zone_countries (zone_id,country_code) VALUES (?,?)", [id, code], db);
  await executeMutation("DELETE FROM shipping_zone_postcodes WHERE zone_id=?", [id], db);
  for (const pattern of postcodes) await executeMutation("INSERT INTO shipping_zone_postcodes (zone_id,pattern) VALUES (?,?)", [id, pattern], db);
}
async function saveZone(id: string | null, form: FormData) {
  await requireAdministrator(["OWNER", "MANAGER"]);
  const parsed = parseShippingZone(form);
  if (!parsed.success || (id !== null && !isDatabaseId(id))) invalid("zones");
  const item = parsed.data;
  const zoneId = await withTransaction(async db => {
    if (id && !await selectOne("SELECT id FROM shipping_zones WHERE id=? FOR UPDATE", [id], db)) invalid("zones");
    const result = id
      ? await executeMutation("UPDATE shipping_zones SET name=?,is_active=?,sort_order=? WHERE id=?", [item.name, item.isActive, item.sortOrder, id], db)
      : await executeMutation("INSERT INTO shipping_zones (name,is_active,sort_order) VALUES (?,?,?)", [item.name, item.isActive, item.sortOrder], db);
    const target = id ?? String(result.insertId);
    await syncZone(target, item.countries, item.postcodes, db);
    return target;
  });
  await saved("shipping_zone", zoneId, id ? "SHIPPING_ZONE_UPDATE" : "SHIPPING_ZONE_CREATE", `Saved shipping zone ${item.name}`, "zones");
}
export async function createZoneAction(form: FormData): Promise<void> { await saveZone(null, form); }
export async function updateZoneAction(id: string, form: FormData): Promise<void> { await saveZone(id, form); }

async function saveMethod(id: string | null, form: FormData) {
  await requireAdministrator(["OWNER", "MANAGER"]);
  const parsed = parseShippingMethod(form);
  if (!parsed.success || (id !== null && !isDatabaseId(id))) invalid("methods");
  const item = parsed.data;
  const values = [item.name, item.methodType, item.pricingMode, item.pricePence, item.allowFreeShippingCoupon,
    item.estimatedDaysMin, item.estimatedDaysMax, item.isActive, item.sortOrder];
  if (id && !await selectOne("SELECT id FROM shipping_methods WHERE id=?", [id])) invalid("methods");
  const result = id
    ? await executeMutation(`UPDATE shipping_methods SET name=?,method_type=?,pricing_mode=?,price_pence=?,allow_free_shipping_coupon=?,estimated_days_min=?,estimated_days_max=?,is_active=?,sort_order=? WHERE id=?`, [...values, id])
    : await executeMutation(`INSERT INTO shipping_methods (name,method_type,pricing_mode,price_pence,allow_free_shipping_coupon,estimated_days_min,estimated_days_max,is_active,sort_order) VALUES (?,?,?,?,?,?,?,?,?)`, values);
  await saved("shipping_method", id ?? String(result.insertId), id ? "SHIPPING_METHOD_UPDATE" : "SHIPPING_METHOD_CREATE", `Saved shipping method ${item.name}`, "methods");
}
export async function createMethodAction(form: FormData): Promise<void> { await saveMethod(null, form); }
export async function updateMethodAction(id: string, form: FormData): Promise<void> { await saveMethod(id, form); }

export async function saveZoneRatesAction(zoneId: string, form: FormData): Promise<void> {
  await requireAdministrator(["OWNER", "MANAGER"]);
  if (!isDatabaseId(zoneId)) invalid("zones");
  const methodIds = [...new Set(formStringList(form, "methodIds"))];
  await withTransaction(async db => {
    if (!await selectOne("SELECT id FROM shipping_zones WHERE id=? FOR UPDATE", [zoneId], db)) invalid("zones");
    const methods = await selectRows<RowDataPacket & { id: string; pricing_mode: string; price_pence: number }>("SELECT CAST(id AS CHAR) AS id,pricing_mode,price_pence FROM shipping_methods FOR UPDATE", [], db);
    const parsed = shippingRatesSchema.safeParse(methodIds.map(methodId => {
      const method = methods.find(item => item.id === methodId);
      return { methodId, pricePence: !method ? null : method.pricing_mode === "FLAT_RATE" ? Number(method.price_pence) : poundsToPence(formString(form, `price.${methodId}`)) };
    }));
    if (!parsed.success) invalid("zones");
    await executeMutation("DELETE FROM shipping_method_rates WHERE zone_id=?", [zoneId], db);
    for (const rate of parsed.data) await executeMutation("INSERT INTO shipping_method_rates (zone_id,method_id,price_pence) VALUES (?,?,?)", [zoneId, rate.methodId, rate.pricePence], db);
  });
  await saved("shipping_zone", zoneId, "SHIPPING_RATES_UPDATE", "Updated available methods and zone rates", "zones");
}

async function saveRule(id: string | null, form: FormData) {
  await requireAdministrator(["OWNER", "MANAGER"]);
  const parsed = parseShippingRule(form);
  if (!parsed.success || (id !== null && !isDatabaseId(id))) invalid("rules");
  const item = parsed.data;
  const ruleId = await withTransaction(async db => {
    if (id && !await selectOne("SELECT id FROM shipping_rules WHERE id=? FOR UPDATE", [id], db)) invalid("rules");
    if (item.zoneId && !await selectOne("SELECT id FROM shipping_zones WHERE id=?", [item.zoneId], db)) invalid("rules");
    const methods = await selectRows<RowDataPacket & { id: string }>("SELECT CAST(id AS CHAR) AS id FROM shipping_methods", [], db);
    if (item.methodIds.some(target => !methods.some(method => method.id === target))) invalid("rules");
    const values = [item.name, item.minimumSubtotalPence, item.thresholdBasis, item.zoneId, item.priority, item.isActive];
    const result = id
      ? await executeMutation("UPDATE shipping_rules SET name=?,minimum_subtotal_pence=?,threshold_basis=?,zone_id=?,priority=?,is_active=? WHERE id=?", [...values, id], db)
      : await executeMutation("INSERT INTO shipping_rules (name,minimum_subtotal_pence,threshold_basis,zone_id,priority,is_active) VALUES (?,?,?,?,?,?)", values, db);
    const target = id ?? String(result.insertId);
    await executeMutation("DELETE FROM shipping_rule_methods WHERE rule_id=?", [target], db);
    for (const methodId of item.methodIds) await executeMutation("INSERT INTO shipping_rule_methods (rule_id,method_id) VALUES (?,?)", [target, methodId], db);
    return target;
  });
  await saved("shipping_rule", ruleId, id ? "SHIPPING_RULE_UPDATE" : "SHIPPING_RULE_CREATE", `Saved automatic shipping rule ${item.name}`, "rules");
}
export async function createRuleAction(form: FormData): Promise<void> { await saveRule(null, form); }
export async function updateRuleAction(id: string, form: FormData): Promise<void> { await saveRule(id, form); }
