import Link from "next/link";
import { notFound } from "next/navigation";
import type { RowDataPacket } from "mysql2/promise";
import PageHeader from "@/components/admin/PageHeader";
import Notice from "@/components/admin/Notice";
import LegacyBadge from "@/components/admin/LegacyBadge";
import { getCustomer } from "@/lib/admin/customers";
import { isDatabaseId } from "@/lib/admin/form";
import { selectRows } from "@/lib/db/query";
import { requireAdministrator } from "@/lib/auth/session";
import { updateCustomerAction } from "../actions";

export default async function CustomerPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireAdministrator(["OWNER", "MANAGER"]);
  const { id } = await params; if (!isDatabaseId(id)) notFound();
  const customer = await getCustomer(id); if (!customer) notFound();
  const [query, addresses, links, wishlists, carts] = await Promise.all([searchParams,
    selectRows<RowDataPacket>("SELECT * FROM customer_addresses WHERE customer_id=? ORDER BY address_type", [id]),
    selectRows<RowDataPacket>("SELECT source_table,source_id,import_id FROM legacy_customer_links WHERE customer_id=? ORDER BY source_table,source_id", [id]),
    selectRows<RowDataPacket>("SELECT w.id,w.name,COUNT(i.id) item_count FROM customer_wishlists w LEFT JOIN customer_wishlist_items i ON i.wishlist_id=w.id WHERE w.customer_id=? GROUP BY w.id", [id]),
    selectRows<RowDataPacket>("SELECT id,contents_json FROM customer_saved_carts WHERE customer_id=?", [id]),
  ]);
  const input = "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm";
  return <div>
    <PageHeader title={customer.full_name || "Customer"} eyebrow="Customers" actions={<Link href={`/admin/orders?customerId=${id}`} className="rounded-lg bg-zinc-950 px-4 py-2 text-sm text-white">View {customer.order_count} orders</Link>} />
    <div className="mt-3"><LegacyBadge source={customer.source} importId={customer.import_id} /></div>
    {query.saved ? <Notice type="success">Customer saved.</Notice> : null}{query.error ? <Notice>{query.error === "email" ? "This email belongs to another customer." : "Check the customer details."}</Notice> : null}
    <div className="mt-6 grid gap-5 lg:grid-cols-2">
      <form action={updateCustomerAction.bind(null, id)} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="font-semibold">Contact details</h2><p className="text-xs text-zinc-500">Changes here do not alter past order addresses or the source archive.</p>
        <label className="block text-sm">Name<input className={input} name="name" defaultValue={customer.full_name} required maxLength={255} /></label>
        <label className="block text-sm">Email<input className={input} type="email" name="email" defaultValue={customer.email ?? ""} maxLength={320} /></label>
        <label className="block text-sm">Phone<input className={input} name="phone" defaultValue={customer.phone ?? ""} maxLength={100} /></label>
        <label className="block text-sm">Internal notes<textarea className={input} name="notes" defaultValue={customer.admin_notes ?? ""} maxLength={10000} rows={4} /></label>
        <button className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white">Save customer</button>
      </form>
      <div className="space-y-5"><section className="rounded-xl border border-zinc-200 bg-white p-5"><h2 className="font-semibold">Purchase history</h2><p className="mt-3 text-sm">{customer.order_count} orders · £{(Number(customer.spent_pence) / 100).toFixed(2)} net payments</p><p className="mt-2 text-sm text-zinc-500">Added {new Date(customer.created_at).toLocaleDateString("en-GB")}{customer.registered_at ? ` · Registered ${new Date(customer.registered_at).toLocaleDateString("en-GB")}` : ""}</p></section>
        {addresses.map(address => <section key={address.id} className="rounded-xl border border-zinc-200 bg-white p-5"><h2 className="font-semibold">{address.address_type.toLowerCase()} address</h2><address className="mt-3 whitespace-pre-line text-sm not-italic text-zinc-600">{[address.full_name,address.company,address.line_1,address.line_2,address.city,address.region,address.postal_code,address.country_code,address.phone].filter(Boolean).join("\n")}</address></section>)}
        {wishlists.length ? <section className="rounded-xl border border-zinc-200 bg-white p-5"><h2 className="font-semibold">Saved wishlists</h2>{wishlists.map(list => <p className="mt-2 text-sm" key={list.id}><Link className="text-amber-700 underline" href={`/admin/saved-lists?customerId=${id}`}>{list.name || "Wishlist"}</Link> · {list.item_count} items</p>)}</section> : null}
        {carts.length ? <section className="rounded-xl border border-zinc-200 bg-white p-5"><h2 className="font-semibold">Historical saved carts</h2>{carts.map(cart => <details key={cart.id} className="mt-3"><summary className="cursor-pointer text-sm">Cart #{cart.id}</summary><pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-all text-xs">{typeof cart.contents_json === "string" ? cart.contents_json : JSON.stringify(cart.contents_json, null, 2)}</pre></details>)}</section> : null}
      </div>
    </div>
    {links.length ? <details className="mt-5 rounded-xl border border-zinc-200 bg-white p-5"><summary className="cursor-pointer font-semibold">Original record references ({links.length})</summary><ul className="mt-3 space-y-1 text-xs text-zinc-600">{links.map(link => <li key={`${link.source_table}:${link.source_id}`}>{link.source_table} · #{link.source_id} · import #{link.import_id}</li>)}</ul></details> : null}
  </div>;
}
