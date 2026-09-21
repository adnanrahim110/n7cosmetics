import { z } from "zod";

const schema = z.object({ name: z.string(), zoneName: z.string(), basePricePence: z.number(), pricePence: z.number(),
  adjustment: z.object({ name: z.string(), source: z.enum(["RULE", "COUPON"]), amountPence: z.number() }).nullable() });
export default function OrderShippingDetails({ snapshot, currency }: { snapshot: unknown; currency: string }) {
  let value: unknown = snapshot;
  if (typeof value === "string") { try { value = JSON.parse(value); } catch { return null; } }
  const result = schema.safeParse(value);
  if (!result.success) return null;
  const shipping = result.data;
  const money = (amount: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(amount / 100);
  return <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
    <h2 className="text-base font-semibold">Shipping calculation</h2>
    <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
      <dt className="text-zinc-500">Method</dt><dd>{shipping.name}</dd>
      <dt className="text-zinc-500">Zone</dt><dd>{shipping.zoneName}</dd>
      <dt className="text-zinc-500">Base charge</dt><dd>{money(shipping.basePricePence)}</dd>
      {shipping.adjustment ? <><dt className="text-zinc-500">{shipping.adjustment.name} ({shipping.adjustment.source === "RULE" ? "automatic" : "coupon"})</dt><dd>−{money(shipping.adjustment.amountPence)}</dd></> : null}
      <dt className="font-medium">Shipping charged</dt><dd className="font-medium">{money(shipping.pricePence)}</dd>
    </dl>
  </section>;
}
