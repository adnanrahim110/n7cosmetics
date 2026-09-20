import Link from "next/link";
import { Search } from "lucide-react";
import CustomerExport from "@/components/admin/CustomerExport";
import PageHeader from "@/components/admin/PageHeader";
import Pagination, { parsePage } from "@/components/admin/Pagination";
import LegacyBadge from "@/components/admin/LegacyBadge";
import { countCustomers, customerSearch, customerOrigin, getCustomers } from "@/lib/admin/customers";
import { requireAdministrator } from "@/lib/auth/session";

const date = (value: Date | null) => value ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(value)) : "—";
export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; source?: string; page?: string }> }) {
  await requireAdministrator(["OWNER", "MANAGER"]);
  const query = await searchParams, q = customerSearch(query.q), source = customerOrigin(query.source);
  const totalItems = await countCustomers(q, source), page = Math.min(parsePage(query.page), Math.max(1, Math.ceil(totalItems / 25)));
  const customers = await getCustomers(q, source, 25, (page - 1) * 25);
  return <div>
    <PageHeader eyebrow="Sales" title="Customers" description="Contact details, purchase history and customer records." actions={<CustomerExport query={q} source={source} />} />
    <form className="mt-7 flex flex-wrap gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <label className="flex min-w-44 flex-1 items-center rounded-lg border border-zinc-300 px-3"><Search size={16} className="text-zinc-400" /><input aria-label="Search customers" className="w-full px-2 py-2 text-sm outline-none" name="q" defaultValue={q} maxLength={100} placeholder="Name, email or phone" /></label>
      <select aria-label="Customer origin" name="source" defaultValue={source} className="rounded-lg border border-zinc-300 px-3 text-sm"><option value="ALL">All customers</option><option value="LEGACY">Historical</option><option value="LIVE">New website</option></select>
      <button className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white">Search</button>
    </form>
    <p className="mt-4 text-sm text-zinc-500">{totalItems.toLocaleString("en-GB")} customers. Export includes all matching records. Spend is GBP payments less refunds.</p>
    <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full text-left text-sm">
      <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500"><tr>{["Customer", "Phone", "Orders", "Net spend", "Last order", "Added", "Origin"].map(label => <th className="px-4 py-3 font-medium" key={label}>{label}</th>)}</tr></thead>
      <tbody className="divide-y divide-zinc-100">{customers.map(customer => <tr key={customer.id} className="hover:bg-zinc-50/70">
        <td className="px-4 py-3"><Link className="font-medium hover:text-amber-700" href={`/admin/customers/${customer.id}`}>{customer.full_name || "Name not recorded"}</Link><p className="text-xs text-zinc-500">{customer.email || "Email not recorded"}</p></td>
        <td className="px-4 py-3">{customer.phone || "—"}</td><td className="px-4 py-3"><Link className="text-amber-700 underline" href={`/admin/orders?customerId=${customer.id}`}>{customer.order_count}</Link></td>
        <td className="px-4 py-3">£{(Number(customer.spent_pence) / 100).toFixed(2)}</td><td className="whitespace-nowrap px-4 py-3">{date(customer.last_order_at)}</td><td className="whitespace-nowrap px-4 py-3">{date(customer.created_at)}</td><td className="px-4 py-3">{customer.source === "LIVE" ? "New website" : <LegacyBadge source={customer.source} importId={customer.import_id} />}</td>
      </tr>)}{!customers.length ? <tr><td colSpan={7} className="px-4 py-12 text-center text-zinc-500">No matching customers.</td></tr> : null}</tbody>
    </table></div><Pagination page={page} pageSize={25} totalItems={totalItems} pathname="/admin/customers" query={{ q, source }} /></div>
  </div>;
}
