import ProductCodeBar from "@/components/ui/ProductCodeBar";

export default function CartProductLabels({
  productCode,
  inspiredBy,
}: {
  productCode?: string | null;
  inspiredBy?: string | null;
}) {
  const code = productCode?.trim();
  const inspiration = inspiredBy?.trim();
  if (!code && !inspiration) return null;

  return (
    <div className="mt-2 flex min-w-0 items-start gap-2">
      <ProductCodeBar code={code} className="shrink-0" compact />
      {inspiration ? (
        <p className="min-w-0 break-words text-[10px] leading-4 text-[#6b4d2c]">
          Inspired by <span className="font-semibold">{inspiration}</span>
        </p>
      ) : null}
    </div>
  );
}
