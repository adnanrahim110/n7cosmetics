"use client";

import { Pause, Play } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { homeContent } from "../../content/home";

const ease = [0.22, 1, 0.36, 1];

export default function ScentStorySection() {
  const story = homeContent.scentStory;
  const mainVideoRef = useRef(null);
  const detailVideoRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPreviewReady, setIsPreviewReady] = useState(false);

  useEffect(() => {
    const detailVideo = detailVideoRef.current;
    if (!detailVideo) return;

    if (shouldReduceMotion) {
      detailVideo.pause();
      return;
    }

    detailVideo.play().catch(() => undefined);
  }, [shouldReduceMotion]);

  const toggleMainFilm = () => {
    const video = mainVideoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => setIsPlaying(false));
    } else {
      video.pause();
    }
  };

  const prepareMainPreview = (event) => {
    const video = event.currentTarget;
    const previewTime = Math.min(1.25, Math.max(0, video.duration - 0.1));

    if (Number.isFinite(previewTime)) {
      video.currentTime = previewTime;
    }
  };

  return (
    <section className="relative isolate overflow-hidden bg-[#120d0a] py-24 text-[#f1e8dc] md:py-32">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_78%_24%,rgba(180,124,67,0.18),transparent_35%),radial-gradient(circle_at_8%_90%,rgba(120,67,38,0.12),transparent_31%),linear-gradient(135deg,#17100c_0%,#0b0807_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:100%_72px]" />

      <div className="mx-auto grid max-w-360 items-center gap-16 px-4 sm:px-8 lg:grid-cols-[0.76fr_1.24fr] lg:gap-12 lg:px-12 xl:gap-20">
        <div className="relative z-10 lg:pr-6">
          <motion.span
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.75, ease }}
            className="mb-6 flex items-center gap-4 text-[10px] font-semibold uppercase tracking-[0.32em] text-[#c99b69]"
          >
            <span className="h-px w-10 bg-[#c99b69]/65" />
            {story.eyebrow}
          </motion.span>

          <motion.h2
            initial={{ clipPath: shouldReduceMotion ? "inset(0)" : "inset(100% 0 0 0)", y: shouldReduceMotion ? 0 : 28 }}
            whileInView={{ clipPath: "inset(0% 0 0 0)", y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: shouldReduceMotion ? 0 : 1.05, delay: shouldReduceMotion ? 0 : 0.06, ease }}
            className="font-heading text-5xl uppercase leading-[0.9] tracking-[0.055em] text-[#f1e8dc] sm:text-6xl xl:text-8xl"
          >
            {story.title.lead}
            <span className="block font-light italic lowercase tracking-normal text-[#c99b69]">{story.title.accent}</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.85, delay: shouldReduceMotion ? 0 : 0.16, ease }}
            className="mt-8 max-w-lg font-light leading-7 text-white/55"
          >
            {story.description}
          </motion.p>

          <motion.blockquote
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.85, delay: shouldReduceMotion ? 0 : 0.24, ease }}
            className="mt-10 border-y border-white/12 py-7 font-heading text-2xl italic leading-snug text-[#d9c1a6] sm:text-3xl"
          >
            &ldquo;{story.quote}&rdquo;
          </motion.blockquote>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.8, delay: shouldReduceMotion ? 0 : 0.32 }}
            className="mt-7 flex items-center justify-between gap-5 text-[9px] font-semibold uppercase tracking-[0.28em] text-white/35"
          >
            <span>{story.filmLabel}</span>
            <span>{story.duration}</span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 45 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: shouldReduceMotion ? 0 : 1.1, delay: shouldReduceMotion ? 0 : 0.1, ease }}
          className="relative h-150 sm:h-190 lg:h-205"
        >
          <div className="absolute right-0 top-0 h-full w-[76%] overflow-hidden border border-white/10 bg-[#080605] shadow-[0_40px_90px_rgba(0,0,0,0.56)] sm:w-[70%]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(198,145,91,0.26),transparent_38%),linear-gradient(145deg,#21150f_0%,#090605_100%)]">
              <div className="absolute inset-6 border border-white/8 sm:inset-8" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-kindred text-6xl uppercase tracking-[0.08em] text-[#d8b17f]/24 sm:text-8xl">N7</span>
                <span className="mt-5 text-[8px] font-semibold uppercase tracking-[0.35em] text-white/28">Founder journal</span>
              </div>
            </div>
            <video
              ref={mainVideoRef}
              src={story.mainVideo}
              playsInline
              preload="metadata"
              controls={isPlaying}
              onLoadedMetadata={prepareMainPreview}
              onSeeked={() => setIsPreviewReady(true)}
              onPlay={() => setIsPlaying(true)}
              onPlaying={() => setIsPreviewReady(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              className={`relative size-full object-cover transition-opacity duration-700 ${isPreviewReady ? "opacity-100" : "opacity-0"}`}
              aria-label="Play the N7 founder journey film"
            />
            <div className={`pointer-events-none absolute inset-0 bg-linear-to-t from-black/48 via-transparent to-black/12 transition-opacity duration-500 ${isPlaying ? "opacity-0" : "opacity-100"}`} />
            {!isPlaying && (
              <button
                type="button"
                onClick={toggleMainFilm}
                className="group absolute inset-0 flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-[-5px] focus-visible:outline-white"
                aria-label="Play founder journey film"
              >
                <span className="flex size-20 items-center justify-center rounded-full border border-white/55 bg-black/12 text-white backdrop-blur-md transition-all duration-500 group-hover:scale-105 group-hover:border-white group-hover:bg-black/35">
                  <Play className="ml-1 size-6" fill="currentColor" />
                </span>
              </button>
            )}
            {isPlaying && (
              <button
                type="button"
                onClick={toggleMainFilm}
                className="absolute right-5 top-5 z-10 flex size-11 items-center justify-center rounded-full border border-white/50 bg-black/30 text-white backdrop-blur-md transition-colors hover:bg-black/55 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                aria-label="Pause founder journey film"
              >
                <Pause className="size-4" fill="currentColor" />
              </button>
            )}
            <div className={`pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-5 text-[9px] font-semibold uppercase tracking-[0.25em] text-white/75 transition-opacity duration-500 sm:p-7 ${isPlaying ? "opacity-0" : "opacity-100"}`}>
              <span>Founder journal</span>
              <span>Dubai</span>
            </div>
          </div>

          <div className="absolute bottom-[8%] left-0 z-20 h-[43%] w-[38%] overflow-hidden border-[6px] border-[#120d0a] bg-[#080605] shadow-[0_28px_65px_rgba(0,0,0,0.62)] sm:border-[10px]">
            <video
              ref={detailVideoRef}
              src={story.detailVideo}
              muted
              loop
              playsInline
              preload="metadata"
              className="size-full object-cover"
              aria-hidden="true"
              tabIndex={-1}
            />
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/35 via-transparent to-transparent" />
            <span className="absolute bottom-4 left-4 text-[8px] font-semibold uppercase tracking-[0.24em] text-white/80 sm:bottom-5 sm:left-5">
              A detail in motion
            </span>
          </div>

          <div className="absolute left-[8%] top-[4%] hidden -rotate-90 text-[9px] font-semibold uppercase tracking-[0.3em] text-white/28 sm:block">
            Portrait study / N7
          </div>
        </motion.div>
      </div>
    </section>
  );
}
