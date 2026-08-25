"use client";

import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  Droplets,
  Gem,
  Leaf,
  Play,
  Sparkles,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

const promises = [
  {
    icon: Droplets,
    number: "01",
    title: "Authentic fragrances",
    description:
      "Middle Eastern fragrance artistry, brought to the UK with provenance and care.",
  },
  {
    icon: Gem,
    number: "02",
    title: "Premium quality",
    description:
      "Meticulously sourced ingredients composed for a rich, memorable trail.",
  },
  {
    icon: Sparkles,
    number: "03",
    title: "Curated exclusivity",
    description:
      "A distinctive edit of Yusuf Bhai creations selected for individual character.",
  },
  {
    icon: Leaf,
    number: "04",
    title: "Conscious luxury",
    description:
      "Cruelty-free, responsibly sourced products crafted with consideration.",
  },
] as const;

function GoldArrow() {
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-full border border-[#c99b69]/55 transition-transform duration-500 group-hover:translate-x-1">
      <ArrowRight aria-hidden="true" className="size-4" strokeWidth={1.4} />
    </span>
  );
}

export default function AboutExperience() {
  const storyVideoRef = useRef<HTMLVideoElement>(null);
  const reduceMotion = useReducedMotion();
  const duration = reduceMotion ? 0 : 0.9;
  const [isStoryVideoPlaying, setIsStoryVideoPlaying] = useState(false);

  const playStoryVideo = () => {
    storyVideoRef.current?.play().catch(() => {
      setIsStoryVideoPlaying(false);
    });
  };

  return (
    <div className="overflow-hidden bg-[#f7f3eb]">
      <section className="relative isolate min-h-svh overflow-hidden bg-[#0a0d0d] pt-40 text-[#f6efe6] sm:pt-44">
        <div className="grid min-h-[calc(100svh-6rem)] lg:grid-cols-[52%_48%]">
          <motion.div
            initial={false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: reduceMotion ? 0 : 1.3, ease }}
            className="relative min-h-[38svh] overflow-hidden lg:min-h-0"
          >
            <Image
              src="/imgs/about/hero.jpg"
              alt="A perfumer composing fragrances beside a row of amber bottles"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 52vw"
              className="object-cover object-center lg:object-[54%_center]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,9,9,0.08)_0%,rgba(7,9,9,0.08)_55%,rgba(7,9,9,0.64)_100%)] lg:bg-[linear-gradient(90deg,transparent_56%,#0a0d0d_100%)]" />
            <div className="pointer-events-none absolute inset-y-0 right-[21%] hidden w-px bg-white/8 lg:block" />
            <div className="pointer-events-none absolute inset-y-0 right-[42%] hidden w-px bg-white/6 lg:block" />
            <div className="absolute bottom-5 left-5 flex items-center gap-3 text-[8px] font-semibold uppercase tracking-[0.28em] text-white/60 sm:bottom-8 sm:left-8 lg:bottom-10 lg:left-10">
              <span className="h-px w-8 bg-[#d0a46d]" />
              The atelier / Dubai
            </div>
          </motion.div>

          <div className="relative flex min-h-152 flex-col justify-center px-5 py-14 sm:px-9 sm:py-18 lg:min-h-0 lg:px-[clamp(2.75rem,5vw,7rem)] lg:py-12">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_5%_48%,rgba(201,155,105,0.12),transparent_36%)]" />
            <div className="relative z-10 mx-auto w-full max-w-2xl">
              <motion.div
                initial={false}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration, delay: reduceMotion ? 0 : 0.12, ease }}
                className="flex items-center gap-4 text-[9px] font-semibold uppercase tracking-[0.34em] text-[#d8a66d] sm:text-[10px]"
              >
                <Sparkles
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.3}
                />
                N7 Cosmetics / Our story
                <span className="h-px grow bg-[#d8a66d]/35" />
              </motion.div>

              <motion.h1
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: reduceMotion ? 0 : 1.05,
                  delay: reduceMotion ? 0 : 0.18,
                  ease,
                }}
                className="mt-8 font-heading text-[clamp(2.8rem,13vw,4.5rem)] leading-[0.88] tracking-[-0.055em] text-[#f8f1e8] sm:text-[clamp(3.35rem,6vw,5.5rem)]"
              >
                The essence of
                <span className="mt-2 block font-light italic text-[#caa77f]">
                  timeless elegance.
                </span>
              </motion.h1>

              <motion.p
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration, delay: reduceMotion ? 0 : 0.28, ease }}
                className="mt-8 max-w-xl border-l border-primary-500 pl-5 text-sm font-light leading-7 text-white/66 sm:text-base sm:leading-8"
              >
                Proudly the first company in the UK to officially introduce the
                exquisite fragrances of Yusuf Bhai from the UAE.
              </motion.p>

              <motion.div
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration, delay: reduceMotion ? 0 : 0.36, ease }}
                className="mt-9 flex flex-wrap items-center gap-6"
              >
                <Link
                  href="/yusuf-bhai-originals"
                  className="group inline-flex min-h-14 items-center gap-6 bg-[#b87b38] px-6 text-[10px] font-semibold uppercase tracking-[0.22em] text-white transition-colors duration-500 hover:bg-[#94602b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d8a66d] sm:px-8"
                >
                  Explore the collection
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 transition-transform duration-500 group-hover:translate-x-1"
                  />
                </Link>
                <a
                  href="#our-story"
                  className="group inline-flex items-center gap-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/78 transition-colors hover:text-[#d8a66d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d8a66d]"
                >
                  Discover our story
                  <ArrowDown
                    aria-hidden="true"
                    className="size-4 transition-transform duration-500 group-hover:translate-y-1"
                  />
                </a>
              </motion.div>
            </div>

            <motion.div
              initial={false}
              animate={{ opacity: 1 }}
              transition={{ duration, delay: reduceMotion ? 0 : 0.48 }}
              className="relative z-10 mx-auto mt-13 flex w-full max-w-2xl flex-col gap-5 border-t border-white/12 pt-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-[8px] font-semibold uppercase tracking-[0.24em] text-[#c8a47b]/68">
                <span>Authenticity</span>
                <span>Artistry</span>
                <span>Indulgence</span>
              </div>
              <span className="text-[8px] font-semibold uppercase tracking-[0.24em] text-white/40">
                Est. in the United Kingdom
              </span>
            </motion.div>
          </div>
        </div>
      </section>

      <section
        id="our-story"
        className="relative isolate overflow-hidden bg-[#f7f3eb] py-20 text-[#201a16] sm:py-28 lg:py-36"
      >
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_20%,rgba(184,123,56,0.10),transparent_26%)]" />
        <div className="mx-auto grid max-w-360 items-center gap-14 px-5 sm:px-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-24 lg:px-12">
          <motion.figure
            initial={false}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration, ease }}
            className="relative mx-auto w-full max-w-2xl pb-9 pr-5 sm:pb-12 sm:pr-12"
          >
            <div className="relative mx-auto w-full overflow-hidden bg-black shadow-[0_30px_80px_rgba(61,44,28,0.16)] lg:w-fit">
              <video
                ref={storyVideoRef}
                src="/videos/about.mp4"
                width={720}
                height={1280}
                controls
                playsInline
                preload="metadata"
                onPlay={() => setIsStoryVideoPlaying(true)}
                onPause={() => setIsStoryVideoPlaying(false)}
                onEnded={() => setIsStoryVideoPlaying(false)}
                className="block h-auto w-full lg:max-h-[76svh] lg:w-auto lg:max-w-full"
                aria-label="Watch the N7 Cosmetics story"
              >
                Your browser does not support the video tag.
              </video>
              <div
                className={`pointer-events-none absolute inset-0 bg-linear-to-t from-black/35 via-transparent to-black/10 transition-opacity duration-300 ${isStoryVideoPlaying ? "opacity-0" : "opacity-100"}`}
              />
              {!isStoryVideoPlaying ? (
                <button
                  type="button"
                  onClick={playStoryVideo}
                  aria-label="Play the N7 Cosmetics story video"
                  className="group absolute left-1/2 top-1/2 z-10 flex size-18 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/65 bg-black/30 text-white shadow-[0_12px_35px_rgba(0,0,0,0.28)] backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-white hover:bg-black/50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f7f3eb] sm:size-22"
                >
                  <Play
                    aria-hidden="true"
                    className="ml-1 size-6 sm:size-7"
                    fill="currentColor"
                    strokeWidth={1.5}
                  />
                </button>
              ) : null}
              <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/8" />
            </div>
          </motion.figure>

          <div className="lg:pr-8">
            <motion.div
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration, ease }}
              className="flex items-center gap-4 text-[9px] font-semibold uppercase tracking-[0.32em] text-[#9b6a35]"
            >
              <span className="h-px w-10 bg-[#9b6a35]/60" />
              Who we are
            </motion.div>
            <motion.h2
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: reduceMotion ? 0 : 1,
                delay: reduceMotion ? 0 : 0.08,
                ease,
              }}
              className="mt-6 max-w-2xl font-heading text-[clamp(2.4rem,11vw,4rem)] leading-[0.94] tracking-[-0.045em] text-[#201a16] sm:text-[clamp(2.75rem,5vw,5.8rem)]"
            >
              Our story,
              <span className="block font-light italic text-[#a47442]">
                a legacy of luxury.
              </span>
            </motion.h2>
            <motion.div
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration, delay: reduceMotion ? 0 : 0.16, ease }}
              className="mt-8 space-y-5 text-sm font-light leading-7 text-[#352c25]/70 sm:text-base sm:leading-8"
            >
              <p>
                At N7 Cosmetics, we do not simply sell fragrances—we curate an
                experience. As the first company in the UK to introduce the
                enchanting aromas of Yusuf Bhai from the UAE, we are redefining
                luxury and sophistication.
              </p>
              <p>
                Each fragrance in our collection tells a story, evoking emotion
                and memory with every drop.
              </p>
            </motion.div>
            <motion.div
              initial={false}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration, delay: reduceMotion ? 0 : 0.24 }}
              className="mt-9 border-t border-[#2a211b]/15 pt-7"
            >
              <Link
                href="/yusuf-bhai-originals"
                className="group inline-flex items-center gap-5 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#2a211b] transition-colors hover:text-[#9b6a35] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9b6a35]"
              >
                Enter the collection
                <GoldArrow />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

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
              <h2 className="mt-5 max-w-4xl font-heading text-[clamp(2.4rem,11vw,4.2rem)] leading-[1.1] tracking-[-0.045em] text-[#f4eadf] sm:text-[clamp(2.8rem,5.7vw,6.6rem)]">
                Timeless elegance
                <span className="block font-light italic text-[#caa77f]">
                  in every bottle.
                </span>
              </h2>
            </motion.div>
            <motion.p
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration, delay: reduceMotion ? 0 : 0.12, ease }}
              className="max-w-xl border-l border-[#c99b69]/60 pl-6 text-sm font-light leading-7 text-white/58 sm:text-base sm:leading-8 md:justify-self-end"
            >
              Inspired by the artistry of Middle Eastern perfumery, our journey
              began with a commitment to quality, authenticity and innovation.
              We collaborate with expert perfumers and skincare specialists to
              bring handcrafted, premium cosmetics to the UK market.
            </motion.p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4">
            {promises.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.article
                  key={item.number}
                  initial={false}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration,
                    delay: reduceMotion ? 0 : index * 0.08,
                    ease,
                  }}
                  className={`group relative min-h-68 px-2 py-10 sm:px-5 lg:px-7 lg:py-12 lg:first:pl-0 lg:last:pr-0 ${index < promises.length - 1 ? "border-b border-white/10" : ""} ${index % 2 === 0 ? "sm:border-r sm:border-white/10" : ""} ${index < 2 ? "sm:border-b sm:border-white/10" : "sm:border-b-0"} ${index < promises.length - 1 ? "lg:border-r lg:border-white/10" : "lg:border-r-0"} lg:border-b-0`}
                >
                  <div className="flex items-center justify-between text-[#c99b69]">
                    <Icon
                      aria-hidden="true"
                      className="size-8"
                      strokeWidth={0.9}
                    />
                    <span className="text-[8px] font-semibold tracking-[0.26em] text-white/28">
                      {item.number}
                    </span>
                  </div>
                  <h3 className="mt-12 font-heading text-2xl leading-tight tracking-normal text-[#f4eadf] sm:text-3xl">
                    {item.title}
                  </h3>
                  <p className="mt-4 max-w-xs text-xs font-light leading-6 text-white/42 sm:text-sm">
                    {item.description}
                  </p>
                  <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-[#c99b69] transition-transform duration-700 group-hover:scale-x-100" />
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#fbf8f2] py-20 text-[#211a15] sm:py-28 lg:py-36">
        <div className="mx-auto grid max-w-360 items-center gap-14 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24 lg:px-12">
          <div className="order-2 lg:order-1">
            <motion.div
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration, ease }}
              className="flex items-center gap-4 text-[9px] font-semibold uppercase tracking-[0.32em] text-[#9b6a35]"
            >
              <BadgeCheck
                aria-hidden="true"
                className="size-4"
                strokeWidth={1.3}
              />
              The N7 difference
              <span className="h-px grow bg-[#9b6a35]/30" />
            </motion.div>
            <motion.h2
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: reduceMotion ? 0 : 1,
                delay: reduceMotion ? 0 : 0.08,
                ease,
              }}
              className="mt-7 font-heading text-[clamp(2.5rem,11vw,4.2rem)] leading-[0.9] tracking-tighter text-[#211a15] sm:text-[clamp(3rem,5.5vw,6rem)]"
            >
              Why choose
              <span className="block font-light italic text-[#a47442]">
                N7 Cosmetics?
              </span>
            </motion.h2>
            <div className="mt-10 divide-y divide-[#2a211b]/12 border-y border-[#2a211b]/12">
              {promises.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={false}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration,
                    delay: reduceMotion ? 0 : index * 0.07,
                    ease,
                  }}
                  className="grid grid-cols-[2.5rem_1fr] gap-4 py-5 sm:grid-cols-[3rem_0.8fr_1.2fr] sm:items-center sm:gap-5"
                >
                  <span className="font-heading text-sm italic text-[#9b6a35]">
                    {item.number}
                  </span>
                  <h3 className="font-heading text-lg tracking-normal text-[#211a15] sm:text-xl">
                    {item.title}
                  </h3>
                  <p className="col-start-2 text-xs font-light leading-6 text-[#342a22]/58 sm:col-start-auto sm:text-sm">
                    {item.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.figure
            initial={false}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration, ease }}
            className="order-1 relative mx-auto w-full max-w-2xl lg:order-2"
          >
            <div className="relative aspect-square overflow-hidden bg-[#16202a] shadow-[0_34px_90px_rgba(39,28,18,0.2)]">
              <Image
                src="/imgs/about/why-n7.webp"
                alt="Two Yusuf Bhai perfume bottles against a dramatic Paris skyline"
                fill
                sizes="(max-width: 1024px) 90vw, 46vw"
                className="object-cover transition-transform duration-1000 hover:scale-[1.025]"
              />
              <div className="absolute inset-0 bg-linear-to-t from-[#0b1015]/58 via-transparent to-transparent" />
              <div className="absolute inset-5 border border-white/18 sm:inset-7" />
              <figcaption className="absolute inset-x-9 bottom-8 flex items-end justify-between gap-6 text-[8px] font-semibold uppercase tracking-[0.24em] text-white/72 sm:inset-x-12 sm:bottom-11">
                <span>Selected for character</span>
                <span>UK / UAE</span>
              </figcaption>
            </div>
            <div className="absolute -bottom-5 -left-3 border border-[#9b6a35]/45 bg-[#f3ede3] px-5 py-3 text-[8px] font-semibold uppercase tracking-[0.24em] text-[#6e4926] sm:-left-8 sm:px-7 sm:py-4">
              Official UK introduction
            </div>
          </motion.figure>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-[#080a0a] py-24 text-[#f6efe6] sm:py-32 lg:py-40">
        <Image
          src="/imgs/about/atelier-hero.webp"
          alt=""
          fill
          sizes="100vw"
          className="-z-30 object-cover object-center opacity-25"
          aria-hidden="true"
        />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,#080a0a_0%,rgba(8,10,10,0.91)_48%,rgba(8,10,10,0.68)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_82%_50%,rgba(196,139,77,0.24),transparent_34%)]" />
        <div className="mx-auto grid max-w-360 items-end gap-12 px-5 sm:px-8 md:grid-cols-[1.25fr_0.75fr] lg:px-12">
          <motion.div
            initial={false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration, ease }}
          >
            <span className="text-[9px] font-semibold uppercase tracking-[0.34em] text-[#c99b69]">
              The art of scent
            </span>
            <h2 className="mt-6 max-w-5xl font-heading text-[clamp(2.8rem,13vw,4.8rem)] leading-[0.86] tracking-[-0.055em] text-[#f6efe6] sm:text-[clamp(3.4rem,7vw,8rem)]">
              A fragrance is
              <span className="block font-light italic text-[#caa77f]">
                an identity.
              </span>
            </h2>
          </motion.div>
          <motion.div
            initial={false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration, delay: reduceMotion ? 0 : 0.12, ease }}
            className="border-t border-white/18 pt-7 md:border-l md:border-t-0 md:pl-8 md:pt-0"
          >
            <p className="max-w-lg text-sm font-light leading-7 text-white/62 sm:text-base sm:leading-8">
              More than a scent, fragrance is confidence, elegance and passion.
              Discover a composition that speaks to your essence and leaves a
              signature entirely your own.
            </p>
            <Link
              href="/premium-collection"
              className="group mt-8 inline-flex items-center gap-5 text-[10px] font-semibold uppercase tracking-[0.24em] text-white transition-colors hover:text-[#d8a66d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d8a66d]"
            >
              Find your fragrance
              <GoldArrow />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
