export function checkoutPhoneNumber(value: string): string {
  return value.replace(/^(?:\+44|0044)\s*/, "").replace(/^0/, "");
}

export function checkoutInternationalPhone(value: string): string {
  const national = checkoutPhoneNumber(value.trim());
  return national ? `+44 ${national}` : "";
}
