"use client";

import AboutBenefitCard, { type AboutBenefit } from "./AboutBenefitCard";
import Title from "@/components/ui/Title";
import { BadgeCheck, MessageCircle, ShieldCheck, Truck } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

const benefits = [
  {
    icon: Truck,
    number: "01",
    title: "Official UK availability & fast fulfilment",
    description:
      "Shop Yusuf Bhai fragrances in the UK. Delivery services, prices and estimated times are confirmed at checkout.",
  },
  {
    icon: BadgeCheck,
    number: "02",
    title: "Verified customer reviews",
    description:
      "Read ratings and reviews on our product pages. Reviews matched to a paid order are marked as verified purchases.",
  },
  {
    icon: ShieldCheck,
    number: "03",
    title: "Secure checkout",
    description:
      "Card payments are processed by Stripe. Your card details are entered directly into Stripe's payment form.",
  },
  {
    icon: MessageCircle,
    number: "04",
    title: "Responsive support",
    description:
      "Use our contact form for product advice, order queries, delivery questions or help with a return.",
  },
] as const satisfies readonly AboutBenefit[];

export default function AboutPassionSection() {
  const reduceMotion = useReducedMotion();
  const duration = reduceMotion ? 0 : 0.9;
  const ease = [0.22, 1, 0.36, 1] as const;

  return (
    <section className="relative isolate overflow-hidden bg-[#15100d] py-20 text-[#f4eadf] sm:py-28 lg:py-34">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_50%_-10%,rgba(195,137,76,0.20),transparent_40%),linear-gradient(135deg,#18110d_0%,#0b0807_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06] bg-[linear-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] bg-size-[100%_76px]" />
      <div className="mx-auto max-w-360 px-5 sm:px-8 lg:px-12">
        <div className="grid items-end gap-9 border-b border-white/12 pb-12 md:grid-cols-[1.08fr_0.92fr] md:pb-16">
          <motion.div
            initial={false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration, ease }}
          >
            <span className="text-[9px] font-semibold uppercase tracking-[0.34em] text-[#c99b69]">
              Our passion
            </span>
            <Title
              className="mt-5 max-w-4xl text-[#f4eadf]"
              highlight="in every bottle."
              highlightClassName="text-[#caa77f]"
              text="Timeless elegance in every bottle."
              tone="custom"
            />
          </motion.div>
          <motion.p
            initial={false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration, delay: reduceMotion ? 0 : 0.12, ease }}
            className="max-w-xl border-l border-[#c99b69]/60 pl-6 text-sm font-light leading-7 text-white/70 sm:text-base sm:leading-8 md:justify-self-end"
          >
            We bring Yusuf Bhai fragrances to UK customers. Browse product
            reviews, compare delivery options at checkout and contact our team
            for help with your order.
          </motion.p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, index) => (
            <AboutBenefitCard
              key={benefit.number}
              benefit={benefit}
              index={index}
              total={benefits.length}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
