"use client";

import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import Title from "@/components/ui/Title";
import type { BrandFilmContent } from "@/lib/homepage/types";

const ease = [0.22, 1, 0.36, 1] as const;

export default function BrandFilmSection({ film }: { film: BrandFilmContent }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (shouldReduceMotion) {
      video.pause();
      return;
    }

    video.play().catch(() => setIsPlaying(false));
  }, [shouldReduceMotion]);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => setIsPlaying(false));
    } else {
      video.pause();
    }
  };

  return (
    <section className="relative isolate min-h-168 overflow-hidden bg-[#080a0b] text-[#f5eee5] sm:min-h-[70svh] md:min-h-[78svh]">
      <video
        ref={videoRef}
        src={film.video}
        muted={isMuted}
        loop
        playsInline
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="absolute inset-0 -z-30 size-full object-cover"
        aria-hidden="true"
        tabIndex={-1}
      />
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(180deg,rgba(5,7,8,0.55)_0%,rgba(5,7,8,0.08)_38%,rgba(5,7,8,0.78)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,7,8,0.42),transparent_42%,rgba(5,7,8,0.18))]" />

      <div className="mx-auto flex min-h-168 max-w-360 flex-col justify-between px-5 py-7 sm:min-h-[70svh] sm:px-8 md:min-h-[78svh] md:py-10 lg:px-12">
        <div className="flex items-start justify-between gap-6 border-t border-white/28 pt-5">
          <motion.span
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.7, ease }}
            className="pt-3 text-[9px] font-semibold uppercase tracking-[0.3em] text-white/70 sm:text-[10px]"
          >
            {film.eyebrow}
          </motion.span>
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlayback}
                aria-label={isPlaying ? "Pause brand film" : "Play brand film"}
                className="flex size-11 items-center justify-center rounded-full border border-white/30 bg-black/10 text-white backdrop-blur-md transition-colors duration-300 hover:border-white/70 hover:bg-black/35 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                {isPlaying ? (
                  <Pause className="size-4" fill="currentColor" />
                ) : (
                  <Play className="ml-0.5 size-4" fill="currentColor" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsMuted((muted) => !muted)}
                aria-label={isMuted ? "Unmute brand film" : "Mute brand film"}
                className="flex size-11 items-center justify-center rounded-full border border-white/30 bg-black/10 text-white backdrop-blur-md transition-colors duration-300 hover:border-white/70 hover:bg-black/35 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                {isMuted ? (
                  <VolumeX className="size-4" />
                ) : (
                  <Volume2 className="size-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="grid items-end gap-8 pb-2 md:grid-cols-[1.35fr_0.65fr] md:pb-4">
          <Title
            className="max-w-7xl uppercase text-[#f4eadf]"
            highlight={film.titleAccent}
            highlightClassName="text-[#d6ad7c]"
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
            className="border-l border-white/30 pl-5 md:justify-self-end md:pl-7"
          >
            <p className="max-w-sm text-sm font-light leading-7 text-white/72 sm:text-base">
              {film.description}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
