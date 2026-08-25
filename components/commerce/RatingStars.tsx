import { Star } from "lucide-react";

export default function RatingStars({ rating, size = 15, className = "" }: { rating: number; size?: number; className?: string }) {
  return (
    <span aria-label={`${rating.toFixed(1)} out of 5 stars`} className={`inline-flex items-center gap-0.5 ${className}`} role="img">
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = Math.max(0, Math.min(1, rating - star + 1));
        return (
          <span className="relative inline-grid" key={star}>
            <Star aria-hidden="true" className="text-[#ad8b62]" size={size} strokeWidth={1.5} />
            <span aria-hidden="true" className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className="fill-[#ad8b62] text-[#ad8b62]" size={size} strokeWidth={1.5} />
            </span>
          </span>
        );
      })}
    </span>
  );
}
