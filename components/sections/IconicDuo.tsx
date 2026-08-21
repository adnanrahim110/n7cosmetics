"use client";

import { ArrowUpRight, Plus } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";

import { homeContent } from "../../content/home";

const ease = [0.22, 1, 0.36, 1] as const;
const productWorlds = [
  {
    background: "/imgs/backgrounds/bg_rose.png",
    accent: "#bd7b6a",
    overlay: "from-[#12090b] via-[#12090b]/55 to-[#12090b]/88",
  },
  {
    background: "/imgs/backgrounds/bg_ocean.png",
    accent: "#8ba9b8",
    overlay: "from-[#071017] via-[#071017]/48 to-[#071017]/90",
  },
];

export default function IconicDuo() {
  const shouldReduceMotion = useReducedMotion();
  const duo = homeContent.iconicDuo;

  return (
    <section className="relative isolate overflow-hidden bg-[#080b0e] py-24 text-[#f4eee6] md:py-32">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(195,148,96,0.12),transparent_34%)]" />

      <div className="mx-auto max-w-360 px-4 sm:px-6 lg:px-8">
        <div className="mb-14 grid gap-8 border-b border-white/12 pb-10 lg:grid-cols-[1fr_auto_1fr] lg:items-end">
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.75, ease }}
            className="flex items-center gap-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#caa276]"
          >
            <span className="size-1.5 rounded-full bg-[#caa276] shadow-[0_0_16px_#caa276]" />
            {duo.eyebrow}
          </motion.div>

          <motion.h2
            initial={{ clipPath: shouldReduceMotion ? "inset(0)" : "inset(100% 0 0 0)", y: shouldReduceMotion ? 0 : 25 }}
            whileInView={{ clipPath: "inset(0% 0 0 0)", y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: shouldReduceMotion ? 0 : 1.1, delay: shouldReduceMotion ? 0 : 0.08, ease }}
            className="text-left font-heading text-5xl uppercase leading-[0.88] tracking-[0.08em] lg:text-center lg:text-7xl xl:text-[5.5rem]"
          >
            Iconic <span className="font-light italic lowercase tracking-normal text-[#caa276]">duo</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.8, delay: shouldReduceMotion ? 0 : 0.15, ease }}
            className="max-w-sm font-light leading-6 text-white/50 lg:justify-self-end lg:text-right"
          >
            Two contrasting signatures, composed to move from the final light of day into the first hour of morning.
          </motion.p>
        </div>

        <div className="relative grid gap-2 lg:grid-cols-2">
          {duo.products.map((product, index) => {
            const world = productWorlds[index];

            return (
              <motion.article
                key={product.name}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 46 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-90px" }}
                transition={{ duration: shouldReduceMotion ? 0 : 1.05, delay: shouldReduceMotion ? 0 : index * 0.12, ease }}
                className="group relative isolate min-h-175 overflow-hidden border border-white/10 sm:min-h-200"
              >
                <Image
                  src={world.background}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="-z-30 object-cover opacity-78 transition-transform duration-1400 ease-[0.22,1,0.36,1] group-hover:scale-105"
                />
                <div className={`absolute inset-0 -z-20 bg-linear-to-t ${world.overlay}`} />
                <div
                  className="absolute left-1/2 top-[44%] -z-10 aspect-square w-[66%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
                  style={{ backgroundColor: `${world.accent}24` }}
                />

                <div className="absolute left-6 top-6 z-20 flex items-center gap-4 sm:left-9 sm:top-9">
                  <span className="flex size-11 items-center justify-center rounded-full border border-white/22 text-[9px] tracking-[0.18em] text-white/65">
                    0{index + 1}
                  </span>
                  <span className="text-[9px] font-semibold uppercase tracking-[0.3em] text-white/48">
                    {product.moment}
                  </span>
                </div>

                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-[14%] z-0 text-center font-kindred text-[clamp(6rem,13vw,12rem)] uppercase leading-none text-transparent opacity-28"
                  style={{ WebkitTextStroke: `1px ${world.accent}` }}
                >
                  {product.name}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 80, rotate: shouldReduceMotion ? 0 : index === 0 ? -3 : 3 }}
                  whileInView={{ opacity: 1, y: 0, rotate: index === 0 ? -2 : 2 }}
                  viewport={{ once: true, margin: "-110px" }}
                  transition={{ duration: shouldReduceMotion ? 0 : 1.35, delay: shouldReduceMotion ? 0 : 0.16 + index * 0.14, ease }}
                  className="absolute inset-x-[19%] bottom-[14%] top-[15%] z-10 transition-transform duration-1000 ease-[0.22,1,0.36,1] group-hover:-translate-y-4 group-hover:scale-[1.035] sm:inset-x-[23%]"
                >
                  <Image
                    src={product.image}
                    alt={`${product.name} fragrance bottle`}
                    fill
                    sizes="(max-width: 1024px) 60vw, 28vw"
                    className="object-contain drop-shadow-[0_42px_30px_rgba(0,0,0,0.62)]"
                  />
                </motion.div>

                <div className="absolute inset-x-0 bottom-0 z-20 p-7 sm:p-10">
                  <div className="flex items-end justify-between gap-5 border-t border-white/18 pt-6">
                    <div>
                      <span
                        className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.28em]"
                        style={{ color: world.accent }}
                      >
                        Signature 0{index + 1}
                      </span>
                      <h3 className="font-heading text-3xl uppercase tracking-[0.14em] text-[#f5eee6] sm:text-4xl">
                        {product.name}
                      </h3>
                    </div>
                    <button
                      type="button"
                      aria-label={`Discover ${product.name}`}
                      className="flex size-12 shrink-0 items-center justify-center rounded-full border border-white/28 text-white transition-all duration-500 hover:border-white hover:bg-white hover:text-[#090d11] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                    >
                      <ArrowUpRight className="size-4" />
                    </button>
                  </div>
                </div>
              </motion.article>
            );
          })}

          <div className="pointer-events-none absolute left-1/2 top-1/2 z-30 hidden size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#d0a574]/45 bg-[#0b0e11] text-[#d0a574] shadow-[0_0_0_10px_rgba(8,11,14,0.7),0_0_45px_rgba(208,165,116,0.14)] lg:flex">
            <Plus className="size-4" strokeWidth={1.25} />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.85, delay: shouldReduceMotion ? 0 : 0.15, ease }}
          className="mt-12 grid gap-7 border-t border-white/12 pt-9 lg:grid-cols-[1fr_auto_1fr] lg:items-center"
        >
          <p className="max-w-md font-light leading-7 text-white/50">{duo.description}</p>
          <button
            type="button"
            className="group relative overflow-hidden border border-[#caa276]/65 bg-[#caa276] px-8 py-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#100d0a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#caa276]"
          >
            <span className="relative z-10 flex items-center justify-center gap-4">
              {duo.cta}
              <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
            <span className="absolute inset-0 translate-y-full bg-[#f3e7d7] transition-transform duration-500 ease-[0.65,0,0.35,1] group-hover:translate-y-0" />
          </button>
          <div className="lg:text-right">
            <span className="block text-[9px] uppercase tracking-[0.28em] text-white/35">The pairing</span>
            <span className="font-heading text-2xl text-[#f3e7d7]">{duo.price}</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
