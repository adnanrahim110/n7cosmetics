import CheckoutForm from "@/components/commerce/checkout/CheckoutForm";
import CheckoutHeading from "@/components/commerce/checkout/CheckoutHeading";

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-[#fbfaf7] pb-16 pt-40 font-sans text-[#181715] sm:pb-24 sm:pt-44">
      <div className="mx-auto max-w-[1248px] px-4 sm:px-8 lg:px-10">
        <CheckoutForm heading={<CheckoutHeading />} />
      </div>
    </div>
  );
}
