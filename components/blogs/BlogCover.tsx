import Image from "next/image";
import { cn } from "@/lib/cn";

interface BlogCoverProps {
  src: string | null;
  alt: string;
  variant: "card" | "article";
}

export default function BlogCover({ src, alt, variant }: BlogCoverProps) {
  if (!src) return null;
  const article = variant === "article";

  return (
    <div className={cn("relative overflow-hidden", article ? "aspect-4/3 border border-primary-300/30 bg-dark-900" : "aspect-3/2 bg-primary-100")}>
      <Image
        alt={alt}
        className="object-cover"
        fetchPriority={article ? "high" : undefined}
        fill
        loading={article ? "eager" : "lazy"}
        sizes={article
          ? "(min-width: 1440px) 720px, (min-width: 1024px) 52vw, 100vw"
          : "(min-width: 1280px) 400px, (min-width: 640px) 50vw, 100vw"}
        src={src}
      />
    </div>
  );
}
