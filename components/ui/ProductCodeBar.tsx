import { cn } from "@/lib/cn";

interface ProductCodeBarProps {
  code?: string | null;
  className?: string;
  compact?: boolean;
}

export default function ProductCodeBar({
  code,
  className = "",
  compact = false,
}: ProductCodeBarProps) {
  const normalizedCode = code?.trim();
  if (!normalizedCode) return null;

  return (
    <span
      className={cn(
        "flex w-fit max-w-full flex-wrap gap-y-1 border border-[#967C55]/40 bg-[#eee3d3] font-semibold uppercase tracking-widest text-[#6b4d2c]",
        compact
          ? "flex-col items-start gap-x-1 px-2 py-1 text-[7px] sm:flex-row sm:items-center sm:text-[8px]"
          : "items-center gap-x-2 px-3 py-1 text-[9px]",
        className,
      )}
    >
      <span>Product code:</span>
      <span
        className={cn(
          "min-w-0 break-all font-mono font-bold tracking-[0.12em]",
          compact ? "text-xs" : "text-sm",
        )}
      >
        {normalizedCode}
      </span>
    </span>
  );
}
