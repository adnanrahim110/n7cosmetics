import Link from "next/link";
import CustomSelect from "@/components/admin/CustomSelect";
import Notice from "@/components/admin/Notice";
import PageHeader from "@/components/admin/PageHeader";
import { penceToPounds } from "@/lib/admin/form";
import { getShippingConfiguration } from "@/lib/commerce/shipping-data";
import type { ShippingMethod, ShippingRule, ShippingZone } from "@/lib/commerce/shipping";
import ShippingMethodFields from "@/components/admin/ShippingMethodFields";
import { createMethodAction, createRuleAction, createZoneAction, saveZoneRatesAction, updateMethodAction, updateRuleAction, updateZoneAction } from "./actions";

const input = "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-700";
const button = "mt-4 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white";
const card = "rounded-xl border border-zinc-200 bg-white shadow-sm";
function Status({ active }: { active: boolean }) { return <span className={`rounded-full px-2 py-1 text-xs ${active ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>{active ? "Active" : "Inactive"}</span>; }
function ZoneFields({ zone }: { zone?: ShippingZone }) {
  return <div className="grid gap-4 sm:grid-cols-2">
    <label className="text-sm">Zone name<input className={input} defaultValue={zone?.name} name="name" maxLength={150} placeholder="United Kingdom" required /></label>
    <label className="text-sm">Country codes<input className={input} defaultValue={zone?.countries.join(", ") ?? "GB"} name="countries" placeholder="GB" required /><span className="mt-1 block text-xs text-zinc-500">Comma-separated ISO codes. Checkout currently accepts UK addresses.</span></label>
    <label className="text-sm sm:col-span-2">Postcodes (optional)<input className={input} defaultValue={zone?.postcodes.join(", ")} name="postcodes" placeholder="BT*, IV*, SW1A 1AA" /><span className="mt-1 block text-xs text-zinc-500">Leave blank for the whole country. Use a trailing * for prefixes, or a full postcode for an exact match. Separate entries with commas.</span></label>
    <label className="text-sm">Zone order<input className={input} defaultValue={zone?.sortOrder ?? 0} name="sortOrder" min={-100000} max={100000} type="number" required /></label>
    <label className="flex items-center gap-2 text-sm"><input defaultChecked={zone?.isActive ?? true} name="isActive" type="checkbox" />Active</label>
  </div>;
}
function RuleFields({ rule, methods, zones }: { rule?: ShippingRule; methods: ShippingMethod[]; zones: ShippingZone[] }) {
  return <div className="grid gap-4 sm:grid-cols-2">
    <label className="text-sm sm:col-span-2">Rule name<input className={input} defaultValue={rule?.name} name="name" maxLength={190} placeholder="Free Standard delivery over £99" required /></label>
    <label className="text-sm">Minimum basket amount (£)<input className={input} defaultValue={penceToPounds(rule?.minimumSubtotalPence ?? 0)} name="minimumSubtotal" min={0} max={999999.99} step="0.01" type="number" required /><span className="mt-1 block text-xs text-zinc-500">This amount or more qualifies. Set 0 for always free.</span></label>
    <CustomSelect label="Calculate the threshold" defaultValue={rule?.thresholdBasis ?? "BEFORE_DISCOUNT"} name="thresholdBasis" options={[{ value: "BEFORE_DISCOUNT", label: "Before merchandise discounts" }, { value: "AFTER_DISCOUNT", label: "After merchandise discounts" }]} searchable={false} required />
    <CustomSelect label="Apply free shipping to these methods" defaultValue={rule?.methodIds ?? []} name="methodIds" multiple options={methods.map(method => ({ value: method.id, label: `${method.name}${method.isActive ? "" : " (inactive)"}` }))} required />
    <CustomSelect label="Zone restriction" defaultValue={rule?.zoneId ?? "all"} name="zoneId" options={[{ value: "all", label: "All supported zones" }, ...zones.map(zone => ({ value: zone.id, label: zone.name }))]} searchable={false} required />
    <label className="text-sm">Priority<input className={input} defaultValue={rule?.priority ?? 0} name="priority" min={-100000} max={100000} type="number" required /><span className="mt-1 block text-xs text-zinc-500">Higher wins. Equal priorities use the oldest rule. Rules never stack.</span></label>
    <label className="flex items-center gap-2 text-sm"><input defaultChecked={rule?.isActive ?? true} name="isActive" type="checkbox" />Active</label>
  </div>;
}

export default async function DeliveryPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string; tab?: string }> }) {
  const [config, query] = await Promise.all([getShippingConfiguration(), searchParams]);
  const { methods, zones, rules } = config;
  const tab = query.tab === "zones" || query.tab === "rules" ? query.tab : "methods";
  return <div>
    <PageHeader eyebrow="Fulfilment" title="Shipping" description="Customers choose a delivery method. Rates set its base price, and eligible rules apply automatically." />
    {query.saved ? <Notice type="success">Shipping settings saved.</Notice> : null}
    {query.error ? <Notice>{query.error === "zones" ? "Check the zone, postcode patterns and enabled method prices." : query.error === "rules" ? "Check the rule amount and select at least one shipping method." : "Check the method name, price and delivery estimates."}</Notice> : null}
    <nav aria-label="Shipping settings" className="mt-6 flex flex-wrap gap-2 border-b border-zinc-200 pb-4">
      {[{ id: "methods", name: "Methods", count: methods.length }, { id: "zones", name: "Zones & rates", count: zones.length }, { id: "rules", name: "Automatic rules", count: rules.length }].map(item => <Link key={item.id} href={`/admin/shipping?tab=${item.id}`} aria-current={tab === item.id ? "page" : undefined} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === item.id ? "bg-zinc-950 text-white" : "bg-white text-zinc-600 hover:bg-zinc-100"}`}>{item.name} <span className="ml-1 opacity-60">{item.count}</span></Link>)}
    </nav>
    {tab === "methods" ? <section className="mt-5 space-y-4">
      <p className="text-sm text-zinc-500">Create services such as Standard delivery, Express or Local pickup. Enable each service in Zones &amp; rates before it can appear at checkout.</p>
      {methods.map(method => <details className={card} key={method.id}>
        <summary className="flex cursor-pointer items-center gap-4 p-5"><div className="flex-1"><p className="font-medium">{method.name}</p><p className="mt-1 text-xs text-zinc-500">{method.pricingMode === "FLAT_RATE" ? `£${penceToPounds(method.pricePence)} flat rate` : "Zone-based rates"} · {method.rates.length} supported {method.rates.length === 1 ? "zone" : "zones"}</p>{!method.rates.length ? <p className="mt-1 text-xs text-amber-700">Add a zone rate to make this method available.</p> : null}</div><Status active={method.isActive} /></summary>
        <form action={updateMethodAction.bind(null, method.id)} className="border-t border-zinc-100 p-5"><ShippingMethodFields method={method} /><button className={button} type="submit">Save method</button></form>
      </details>)}
      <details className={card} open={!methods.length}><summary className="cursor-pointer p-5 font-medium">+ Add shipping method</summary><form action={createMethodAction} className="border-t border-zinc-100 p-5"><ShippingMethodFields /><button className={button} type="submit">Add method</button></form></details>
    </section> : null}
    {tab === "zones" ? <section className="mt-5 space-y-4">
      <p className="text-sm text-zinc-500">Postcode zones match before country-wide zones. Lower zone order wins ties. Only methods enabled in the matching zone are offered.</p>
      {zones.map(zone => <article className={card} key={zone.id}>
        <details><summary className="flex cursor-pointer items-center gap-4 p-5"><div className="flex-1"><p className="font-medium">{zone.name}</p><p className="mt-1 text-xs text-zinc-500">{zone.countries.join(", ")} · {zone.postcodes.length ? zone.postcodes.join(", ") : "All postcodes"}</p></div><Status active={zone.isActive} /></summary><form action={updateZoneAction.bind(null, zone.id)} className="border-t border-zinc-100 p-5"><ZoneFields zone={zone} /><button className={button} type="submit">Save zone</button></form></details>
        <form action={saveZoneRatesAction.bind(null, zone.id)} className="border-t border-zinc-100 bg-zinc-50/50 p-5">
          <h2 className="text-sm font-semibold">Available methods &amp; base rates</h2>
          <div className="mt-3 space-y-3">{methods.map(method => {
            const rate = method.rates.find(item => item.zoneId === zone.id);
            return <div key={method.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3">
              <label className="flex min-w-44 flex-1 items-center gap-2 text-sm"><input type="checkbox" name="methodIds" value={method.id} defaultChecked={Boolean(rate)} />{method.name}{!method.isActive ? " (inactive)" : ""}</label>
              {method.pricingMode === "ZONE_RATES" ? <label className="text-xs text-zinc-500">Zone price (£)<input className={input} aria-label={`${method.name} price in ${zone.name}`} name={`price.${method.id}`} defaultValue={rate ? penceToPounds(rate.pricePence) : ""} type="number" min={0} max={999999.99} step="0.01" placeholder="Enter price" /></label> : <span className="text-sm text-zinc-500">£{penceToPounds(method.pricePence)} · flat rate</span>}
            </div>;
          })}</div>
          {methods.length ? <button className={button} type="submit">Save zone rates</button> : <p className="mt-3 text-sm text-zinc-500">Create a shipping method first.</p>}
        </form>
      </article>)}
      <details className={card} open={!zones.length}><summary className="cursor-pointer p-5 font-medium">+ Add shipping zone</summary><form action={createZoneAction} className="border-t border-zinc-100 p-5"><ZoneFields /><button className={button} type="submit">Add zone</button></form></details>
    </section> : null}
    {tab === "rules" ? <section className="mt-5 space-y-4">
      <p className="text-sm text-zinc-500">Rules automatically make the selected methods free when their basket threshold is met. They do not appear as delivery choices and work alongside merchandise discounts.</p>
      {rules.map(rule => <details className={card} key={rule.id}><summary className="flex cursor-pointer items-center gap-4 p-5"><div className="flex-1"><p className="font-medium">{rule.name}</p><p className="mt-1 text-xs text-zinc-500">£{penceToPounds(rule.minimumSubtotalPence)} or more · {rule.thresholdBasis === "BEFORE_DISCOUNT" ? "before" : "after"} discounts · {methods.filter(method => rule.methodIds.includes(method.id)).map(method => method.name).join(", ")}</p><p className="mt-1 text-xs text-zinc-500">{zones.find(zone => zone.id === rule.zoneId)?.name ?? "All supported zones"}</p></div><Status active={rule.isActive} /></summary><form action={updateRuleAction.bind(null, rule.id)} className="border-t border-zinc-100 p-5"><RuleFields rule={rule} methods={methods} zones={zones} /><button className={button} type="submit">Save rule</button></form></details>)}
      {methods.length ? <details className={card} open={!rules.length}><summary className="cursor-pointer p-5 font-medium">+ Add automatic free-shipping rule</summary><form action={createRuleAction} className="border-t border-zinc-100 p-5"><RuleFields methods={methods} zones={zones} /><button className={button} type="submit">Add rule</button></form></details> : <p className="text-sm text-zinc-500">Create a shipping method before adding a rule.</p>}
    </section> : null}
  </div>;
}
