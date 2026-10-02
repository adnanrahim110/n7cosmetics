import ProductCard from "@/components/ui/ProductCard";
import type { HomepageProduct } from "@/lib/homepage/types";

export default function BestSellerProductGrid({ products }: { products: HomepageProduct[] }) {
  if (!products.length) return null;
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
      {products.map(product => <ProductCard key={product.id} product={product} />)}
    </div>
  );
}
