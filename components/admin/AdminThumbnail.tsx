import { ImageIcon } from "lucide-react";

interface AdminThumbnailProps {
  src: string | null | undefined;
  alt: string;
  size?: "sm" | "md";
}

export default function AdminThumbnail({ src, alt, size = "md" }: AdminThumbnailProps) {
  const dimensions = size === "sm" ? "size-10" : "size-12";

  return (
    <div className={`relative grid shrink-0 place-items-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 text-zinc-400 ${dimensions}`}>
      {src ? (
        // Admin-managed URLs may use local or external storage, so they intentionally bypass next/image host restrictions.
        // eslint-disable-next-line @next/next/no-img-element
        <img alt={alt} className="size-full object-contain p-1" loading="lazy" src={src} />
      ) : (
        <ImageIcon aria-hidden="true" size={17} />
      )}
    </div>
  );
}
