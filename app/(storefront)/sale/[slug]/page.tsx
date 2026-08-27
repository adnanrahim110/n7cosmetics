import Link from "next/link";
import { notFound } from "next/navigation";
import SaleExperience from "@/components/sales/SaleExperience";
import Title from "@/components/ui/Title";
import { getActiveSalePage } from "@/lib/commerce/sales";

export const metadata = {
  title: "Fragrance Sale | N7 Cosmetics",
  description:
    "Explore a limited-time fragrance offer from N7 Cosmetics, available only while stock lasts.",
};

export default async function SalePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sale = await getActiveSalePage(slug);
  if (!sale) notFound();

  if (sale.products.length) return <SaleExperience sale={sale} />;

  return (
    <main className="grid min-h-screen place-items-center bg-[#f3eee5] px-5 pb-20 pt-40 text-center text-[#1c1814]">
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[#8d6745]">Sale</p>
        <Title as="h1" className="mt-4 uppercase" text={sale.saleName} tone="gold" />
        <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-black/50">This offer is being prepared. Please check back shortly.</p>
        <Link className="mt-8 inline-flex bg-[#1c1814] px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white" href="/recreations">Explore fragrances</Link>
      </div>
    </main>
  );
}
