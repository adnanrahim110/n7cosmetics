"use client";
import type { HomepageProduct } from "@/lib/homepage/types";
import { useCommerce } from "../commerce/CommerceProvider";
import BestSellerProductGrid from "./BestSellerProductGrid";
import BestSellersHeader from "./BestSellersHeader";

export default function BestSellers({
  products,
}: {
  products: HomepageProduct[];
}) {
  const { getStock } = useCommerce();
  if (!products.length) return null;
  const availableProducts = products.filter(
    (product) => getStock(product.slug).soldOut === false,
  );
  const recreations = availableProducts.filter(
    (product) => product.isRecreation,
  );
  const others = availableProducts.filter((product) => !product.isRecreation);
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
