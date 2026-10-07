export default function PaymentOptionsError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="mb-2 flex flex-wrap items-center gap-3 text-xs">
    <p className="text-red-700" role="alert">{message}</p>
    <button className="min-h-11 font-semibold text-stone-800 underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-stone-700" onClick={onRetry} type="button">Retry payment options</button>
  </div>;
}
