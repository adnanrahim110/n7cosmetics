"use client";

import { ArrowRight } from "lucide-react";
import { useReducedMotion } from "motion/react";
import * as motion from "motion/react-m";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import Title from "@/components/ui/Title";
import type { BrandFilmContent } from "@/lib/homepage/types";
import { scheduleAfterLoad } from "@/lib/browser/schedule-after-load";
import {
  brandFilmMobileMediaQuery,
  brandFilmPortraitMediaQuery,
  brandFilmVideoSource,
  videoPoster,
  type BrandFilmViewport,
} from "@/lib/media/storefront-assets";

const ease = [0.22, 1, 0.36, 1] as const;

export default function BrandFilmSection({ film }: { film: BrandFilmContent }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [videoViewport, setVideoViewport] = useState<BrandFilmViewport | null>(null);
  const poster = videoPoster(film.video);
  const videoSource = videoViewport ? brandFilmVideoSource(film.video, videoViewport) : undefined;

  useEffect(() => scheduleAfterLoad(() => setVideoEnabled(true)), []);

  useEffect(() => {
    const mobile = window.matchMedia(brandFilmMobileMediaQuery);
    const portrait = window.matchMedia(brandFilmPortraitMediaQuery);
    const updateViewport = () => setVideoViewport(
      mobile.matches ? portrait.matches ? "mobile-portrait" : "mobile-landscape" : "desktop",
    );
    updateViewport();
    mobile.addEventListener("change", updateViewport);
    portrait.addEventListener("change", updateViewport);
    return () => {
      mobile.removeEventListener("change", updateViewport);
      portrait.removeEventListener("change", updateViewport);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSource || (poster && !videoEnabled)) return;

    if (shouldReduceMotion) {
      video.pause();
      return;
    }

    let inView = false;
    const syncPlayback = () => {
      if (inView && document.visibilityState === "visible") void video.play().catch(() => undefined);
      else video.pause();
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncPlayback();
    });
    const visibilityChanged = () => {
      syncPlayback();
    };
    observer.observe(video);
    document.addEventListener("visibilitychange", visibilityChanged);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", visibilityChanged); video.pause(); };
  }, [shouldReduceMotion, videoEnabled, film.video, poster, videoSource]);

  return (
    <section
      aria-labelledby="brand-film-title"
      className="relative isolate overflow-hidden bg-[#080a0b] text-[#f5eee5]"
    >
      {poster ? <link rel="preload" as="image" href={poster} fetchPriority="high" /> : null}
      <video
        ref={videoRef}
        src={!poster || (videoEnabled && !shouldReduceMotion) ? videoSource : undefined}
        poster={poster}
        muted
        loop
        playsInline
        preload={poster ? "none" : "auto"}
        className="absolute inset-0 -z-30 size-full object-cover"
        aria-hidden="true"
        tabIndex={-1}
      />
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(180deg,rgba(5,7,8,0.68)_0%,rgba(5,7,8,0.08)_40%,rgba(5,7,8,0.84)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,7,8,0.42),transparent_42%,rgba(5,7,8,0.18))]" />

      <div className="mx-auto flex min-h-[max(44rem,92svh)] max-w-360 flex-col justify-end gap-16 px-5 pb-9 pt-40 sm:px-8 sm:pb-12 sm:pt-44 lg:px-12 lg:pb-14 lg:pt-48">
        <div className="grid items-end gap-2 md:grid-cols-[1.35fr_0.65fr] md:gap-10">
          <Title
            as="h1"
            id="brand-film-title"
            className="max-w-4xl leading-[1.05]! uppercase text-[#f4eadf] text-[26px] max-md:font-semibold lg:text-6xl"
            highlight={film.titleAccent}
            highlightClassName="text-primary-400"
            text={`${film.titleLead} ${film.titleAccent}`}
            tone="custom"
          />

          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.9,
              delay: shouldReduceMotion ? 0 : 0.16,
              ease,
            }}
            className="md:border-l border-white/30 md:justify-self-end md:pl-7"
          >
            <p className="max-w-sm text-sm font-light text-white/80 sm:text-base">
              {film.description}
            </p>
            <Link
              href="/yusuf-bhai-originals"
              className="group mt-3 inline-flex min-h-13 items-center justify-center gap-8 border border-[#d6ad7c] bg-[#d6ad7c] px-7 py-3.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#1c1814] transition-colors duration-300 hover:border-[#f4eadf] hover:bg-[#f4eadf] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:mt-7 sm:text-[11px]"
            >
              Shop now
              <ArrowRight
                aria-hidden="true"
                className="size-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-1"
              />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
