import type { Appearance } from "@stripe/stripe-js";

export const checkoutFocus =
  "focus-visible:ring-2 focus-visible:ring-[#a67520] focus-visible:ring-offset-2";

export const checkoutInput =
  "min-h-11 w-full min-w-0 rounded border border-[#d4d2cc] bg-white px-4 py-3 text-sm text-[#181715] shadow-xs placeholder:text-[#6b6862] focus:border-[#a67520] focus:ring-2 focus:ring-[#a67520]/20 disabled:cursor-not-allowed disabled:bg-stone-100";

export const checkoutCard =
  "min-w-0 rounded-lg border border-[#e8e3d9] bg-white/40 p-4 sm:p-6";

export const checkoutPaymentAppearance: Appearance = {
  theme: "stripe",
  variables: {
    colorPrimary: "#a67520",
    colorText: "#181715",
    colorTextSecondary: "#5d5b56",
    colorBackground: "#ffffff",
    colorDanger: "#b91c1c",
    borderRadius: "4px",
    spacingUnit: "4px",
    fontFamily: "Arial, sans-serif",
    fontSizeBase: "14px",
  },
};

export function checkoutMoney(pence: number, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(pence / 100);
}
