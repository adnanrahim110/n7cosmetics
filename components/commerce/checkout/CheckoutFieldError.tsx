export default function CheckoutFieldError({ id, message }: { id: string; message?: string }) {
  return message ? <p aria-live="polite" className="mt-1 text-xs font-normal leading-5 text-red-700" id={id}>{message}</p> : null;
}
