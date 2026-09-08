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
      className={`flex w-fit max-w-full flex-wrap items-center gap-y-0.5 border-y border-[#967C55]/40 bg-[#eee3d3] font-semibold uppercase tracking-widest text-[#6b4d2c] ${compact ? "gap-x-1 px-1.5 py-1 text-[8px]" : "gap-x-2 px-2.5 py-0.5 text-[9px]"} ${className}`}
    >
      <span>{compact ? "Code:" : "Product code:"}</span>
      <span
        className={`min-w-0 break-all font-mono font-bold tracking-[0.12em] ${compact ? "text-xs" : "text-sm"}`}
      >
        {normalizedCode}
      </span>
    </span>
  );
}
