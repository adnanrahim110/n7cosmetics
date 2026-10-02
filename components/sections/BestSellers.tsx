import type { HomepageProduct } from "@/lib/homepage/types";
import BestSellersHeader from "./BestSellersHeader";
import BestSellerProductGrid from "./BestSellerProductGrid";

export default function BestSellers({ products }: { products: HomepageProduct[] }) {
  if (!products.length) return null;
  const recreations = products.filter(product => product.isRecreation);
  const others = products.filter(product => !product.isRecreation);
  return (
    <section
      id="home-bestsellers"
      aria-labelledby="home-bestsellers-title"
      className="scroll-mt-28 bg-[#f3eee5] py-12 text-[#1c1814] sm:py-16"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <BestSellersHeader />
        <div className="mt-8 space-y-10">
          <BestSellerProductGrid products={recreations} />
          <BestSellerProductGrid products={others} />
        </div>
      </div>
    </section>
  );
}
