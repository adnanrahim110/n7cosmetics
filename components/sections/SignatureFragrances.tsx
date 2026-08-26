"use client";

import type { HomepageProduct, SignatureContent } from "@/lib/homepage/types";
import { motion } from "motion/react";
import Link from "next/link";
import ProductCard from "../ui/ProductCard";

const customEase = [0.65, 0, 0.35, 1] as const;

export default function SignatureFragrances({
  products,
  content,
}: {
  products: HomepageProduct[];
  content: SignatureContent;
}) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: customEase } },
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#FDFCF8] py-16 sm:py-24 md:py-32">
      <div className="absolute top-0 left-0 w-full h-125 bg-linear-to-b from-[#F2EFE8] to-transparent opacity-50 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-14 flex flex-col items-start justify-between gap-7 md:mb-24 md:flex-row md:items-end md:gap-8">
          <div className="max-w-2xl">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: customEase }}
              className="text-[#967C55] font-medium tracking-[0.2em] text-sm uppercase mb-4 block"
            >
              {content.eyebrow}
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: customEase, delay: 0.1 }}
              className="font-heading text-3xl uppercase leading-[1.05] text-[#1A1A1A] sm:text-4xl md:text-6xl"
            >
              {content.titleLead} <br />
              <span className="text-[#967C55] italic font-light lowercase">
                {content.titleAccent}
              </span>
            </motion.h2>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: customEase, delay: 0.2 }}
            className="text-[#5A5A5A] font-light max-w-md md:text-right"
          >
            {content.description}
          </motion.p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-2 gap-5 lg:gap-y-14 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-0"
        >
          {products.map((product) => (
            <motion.div key={product.id} variants={itemVariants}>
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-20 flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="relative"
          >
            <Link
              className="group relative block overflow-hidden border border-[#1A1A1A] bg-transparent px-10 py-4 text-sm font-medium uppercase tracking-[0.2em] text-[#1A1A1A] transition-colors hover:text-white"
              href={content.ctaUrl}
            >
              <span className="relative z-10">{content.ctaLabel}</span>
              <span className="absolute inset-0 translate-y-full bg-[#1A1A1A] transition-transform duration-500 ease-[0.65,0,0.35,1] group-hover:translate-y-0" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
