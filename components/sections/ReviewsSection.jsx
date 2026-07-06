"use client";

import { motion } from "motion/react";
import { homeContent } from "../../content/home";
import { FaQuoteLeft } from "react-icons/fa";

// Vertical Marquee Column
const VerticalMarquee = ({ reviews, direction = 1, speed = 40 }) => {
  const blockContent = (
    <div className="flex flex-col gap-6 py-3">
      {reviews.map((review, index) => (
        <div 
          key={index} 
          className="w-full h-[280px] shrink-0 border border-[#1a1a1a]/15 bg-[#1a1a1a]/[0.02] p-8 flex flex-col relative transition-colors duration-500 hover:bg-[#1a1a1a]/[0.04]"
        >
          <FaQuoteLeft className="text-[#967C55] text-xl mb-4 relative z-10" />
          
          <p className="text-[#1a1a1a]/80 font-light leading-relaxed mb-6 flex-grow relative z-10 text-sm overflow-hidden text-ellipsis line-clamp-4">
            &quot;{review.text}&quot;
          </p>
          
          <div className="flex items-center gap-4 relative z-10 mt-auto">
            <div className="w-10 h-10 rounded-full border border-[#1a1a1a]/20 flex items-center justify-center text-[#1a1a1a] font-heading text-lg shrink-0">
              {review.author.charAt(0)}
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-[#1a1a1a] tracking-widest uppercase text-[10px] mb-1 truncate">
                {review.author}
              </span>
              <span className="text-[#967C55] text-[9px] uppercase tracking-widest truncate">
                Verified Client
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    // Fixed height of roughly 3 slides (3 * 280px + gaps = ~900px)
    <div className="flex flex-col w-full h-[900px] overflow-hidden relative">
      {/* Top and Bottom fading masks */}
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-[#D8C8B5] to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#D8C8B5] to-transparent z-10 pointer-events-none" />
      
      <motion.div
        className="flex flex-col min-h-max"
        animate={{
          y: direction === 1 ? ["0%", "-50%"] : ["-50%", "0%"],
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {blockContent}
        {blockContent}
      </motion.div>
    </div>
  );
};

export default function ReviewsSection() {
  // Reorder reviews for each column to create variety across the 4 columns
  const col1 = [...homeContent.reviews, ...homeContent.reviews.slice(0, 2)];
  const col2 = [...homeContent.reviews].reverse().concat([...homeContent.reviews].reverse().slice(0, 2));
  const col3 = [...homeContent.reviews.slice(2), ...homeContent.reviews.slice(0, 4)];
  const col4 = [...homeContent.reviews].reverse().slice(1).concat([...homeContent.reviews].reverse().slice(0, 3));

  return (
    <section className="relative py-24 md:py-32 bg-[#D8C8B5] overflow-hidden border-t border-[#1a1a1a]/5 min-h-[100vh] flex flex-col items-center">
      
      {/* Solid Flat Background */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')]" />

      <div className="w-full relative z-20 flex flex-col items-center">
        
        {/* Top Center Header */}
        <div className="text-center px-4 max-w-3xl mx-auto mb-16 md:mb-24">
          <span className="text-[#967C55] font-medium tracking-[0.4em] text-[10px] uppercase block mb-6">
            The Masterpieces Experience
          </span>
          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl text-[#1a1a1a] uppercase tracking-widest leading-tight mb-6">
            Client <span className="text-[#967C55] italic lowercase font-light">Diaries</span>
          </h2>
          <p className="text-[#1a1a1a]/70 font-light leading-relaxed text-sm md:text-base mx-auto">
            Discover how our exclusive formulations and signature scents have left an unforgettable mark on connoisseurs around the world. Pure elegance, entirely flat, and meticulously crafted.
          </p>
        </div>

        {/* 4-Column Full Width Marquee */}
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            <VerticalMarquee reviews={col1} direction={1} speed={40} />
            
            {/* Offset the start positions of adjacent columns slightly by adding padding */}
            <div className="pt-8">
              <VerticalMarquee reviews={col2} direction={-1} speed={50} />
            </div>
            
            <div className="pt-16 hidden lg:block">
              <VerticalMarquee reviews={col3} direction={1} speed={45} />
            </div>
            
            <div className="pt-4 hidden lg:block">
              <VerticalMarquee reviews={col4} direction={-1} speed={55} />
            </div>
          </div>
        </div>
          
      </div>
    </section>
  );
}
