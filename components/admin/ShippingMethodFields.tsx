"use client";

import { useState } from "react";
import CustomSelect from "./CustomSelect";
import { penceToPounds } from "@/lib/admin/form";
import type { ShippingMethod } from "@/lib/commerce/shipping";

const input = "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-700";
export default function ShippingMethodFields({ method }: { method?: ShippingMethod }) {
  const [pricingMode, setPricingMode] = useState(method?.pricingMode ?? "FLAT_RATE");
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <label className="text-sm">Method name<input className={input} name="name" defaultValue={method?.name} placeholder="Standard delivery" maxLength={150} required /></label>
    <CustomSelect label="Service" name="methodType" defaultValue={method?.methodType ?? "DELIVERY"} options={[{ value: "DELIVERY", label: "Delivery" }, { value: "LOCAL_PICKUP", label: "Local pickup" }]} searchable={false} required />
    <CustomSelect label="Pricing" name="pricingMode" value={pricingMode} onChange={values => setPricingMode(values[0] as ShippingMethod["pricingMode"])} options={[{ value: "FLAT_RATE", label: "One flat rate" }, { value: "ZONE_RATES", label: "Different rates per zone" }]} searchable={false} required />
    {pricingMode === "FLAT_RATE" ? <label className="text-sm">Flat price (£)<input className={input} name="price" defaultValue={penceToPounds(method?.pricePence ?? 0)} type="number" min={0} max={999999.99} step="0.01" required /></label> : <p className="self-center text-sm text-zinc-500">Set prices and availability in Zones &amp; rates.</p>}
    <label className="text-sm">Minimum working days<input className={input} name="estimatedDaysMin" defaultValue={method?.estimatedDaysMin ?? ""} type="number" min={0} max={365} /></label>
    <label className="text-sm">Maximum working days<input className={input} name="estimatedDaysMax" defaultValue={method?.estimatedDaysMax ?? ""} type="number" min={0} max={365} /></label>
    <label className="text-sm">Display order<input className={input} name="sortOrder" defaultValue={method?.sortOrder ?? 0} type="number" min={-100000} max={100000} required /><span className="mt-1 block text-xs text-zinc-500">Lower appears first and is the default choice.</span></label>
    <label className="flex items-center gap-2 text-sm"><input name="isActive" type="checkbox" defaultChecked={method?.isActive ?? true} />Active</label>
    <label className="flex items-center gap-2 text-sm"><input name="allowFreeShippingCoupon" type="checkbox" defaultChecked={method?.allowFreeShippingCoupon ?? false} />Accept free-shipping coupons</label>
  </div>;
}
