"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import type { ShowcaseProduct } from "../../content/products";
import { slugify } from "../../lib/admin/form";

export default function ProductCard({ product }: { product: ShowcaseProduct }) {
  const slug = slugify(product.name);
  return (
    <motion.div 
      initial="initial"
      whileHover="hover"
      className="group relative flex flex-col cursor-pointer h-full"
    >
      <Link
        aria-label={`View ${product.name}`}
        className="absolute inset-0 z-20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-400"
        href={`/products/${slug}`}
      />
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-dark-900 border border-white/5 group-hover:border-primary-500/30 transition-colors duration-500">
        <Image
          src={product.image || "/imgs/products/1.png"}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-110 opacity-80 group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-transparent opacity-60" />
        
        <motion.div 
          variants={{
            initial: { opacity: 0, y: 20 },
            hover: { opacity: 1, y: 0 }
          }}
          transition={{ duration: 0.3 }}
          className="pointer-events-none absolute inset-x-0 bottom-6 z-30 flex justify-center px-4"
        >
          <span className="w-full bg-primary-500 px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-dark-950">View product</span>
        </motion.div>
      </div>

      <div className="mt-6 flex flex-col items-center text-center">
        <span className="text-xs tracking-widest text-dark-300 uppercase mb-2">{product.type}</span>
        <h3 className="font-heading text-xl text-primary-100 mb-2 group-hover:text-primary-300 transition-colors">{product.name}</h3>
        <span className="text-sm text-dark-200">{product.price}</span>
      </div>
    </motion.div>
  );
}
