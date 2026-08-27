interface ProductCodeBarProps {
  code?: string | null;
  className?: string;
}

export default function ProductCodeBar({
  code,
  className = "",
}: ProductCodeBarProps) {
  const normalizedCode = code?.trim();
  if (!normalizedCode) return null;

  return (
    <div
      className={`flex w-fit items-center justify-between gap-3 border-y border-[#967C55]/24 bg-[#f7f2ea]/75 px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-[#7A5D38] ${className}`}
    >
      <span>Product code:</span>
      <span className="font-mono text-[10px] tracking-[0.16em]">
        {normalizedCode}
      </span>
    </div>
  );
}
