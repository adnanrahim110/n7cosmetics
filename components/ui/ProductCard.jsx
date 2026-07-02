"use client";

import Image from "next/image";
import { motion } from "motion/react";
import Button from "./Button";

export default function ProductCard({ product }) {
  return (
    <motion.div 
      initial="initial"
      whileHover="hover"
      className="group relative flex flex-col cursor-pointer h-full"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-dark-900 border border-white/5 group-hover:border-primary-500/30 transition-colors duration-500">
        <Image
          src={product.image || "/placeholder.png"}
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
          className="absolute inset-x-0 bottom-6 flex justify-center px-4"
        >
          <Button variant="primary" className="w-full">
            Quick View
          </Button>
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
