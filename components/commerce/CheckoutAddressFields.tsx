const input = "mt-1.5 w-full rounded-none border border-black/20 bg-white/50 px-3 py-2.5 text-sm outline-none focus:border-[#8d6745]";

export default function CheckoutAddressFields({ prefix }: { prefix: "billing" | "shipping" }) {
  const autocomplete = (field: string) => `${prefix} ${field}`;
  return <>
    <label className="text-sm">First name *<input className={input} name={`${prefix}.firstName`} autoComplete={autocomplete("given-name")} maxLength={90} required /></label>
    <label className="text-sm">Last name *<input className={input} name={`${prefix}.lastName`} autoComplete={autocomplete("family-name")} maxLength={90} required /></label>
    <label className="text-sm sm:col-span-2">Company (optional)<input className={input} name={`${prefix}.company`} autoComplete={autocomplete("organization")} maxLength={190} /></label>
    <label className="text-sm sm:col-span-2">Country / region *<select className={`${input} disabled:cursor-not-allowed disabled:bg-black/5 disabled:text-black/60 disabled:opacity-100`} name={`${prefix}.countryCode`} autoComplete={autocomplete("country")} defaultValue="GB" disabled><option value="GB">United Kingdom (UK)</option></select></label>
    <label className="text-sm sm:col-span-2">Street address *<input className={input} name={`${prefix}.line1`} autoComplete={autocomplete("address-line1")} maxLength={190} required /></label>
    <label className="text-sm sm:col-span-2">Apartment, suite, unit (optional)<input className={input} name={`${prefix}.line2`} autoComplete={autocomplete("address-line2")} maxLength={190} /></label>
    <label className="text-sm">Town / city *<input className={input} name={`${prefix}.city`} autoComplete={autocomplete("address-level2")} maxLength={120} required /></label>
    <label className="text-sm">County (optional)<input className={input} name={`${prefix}.region`} autoComplete={autocomplete("address-level1")} maxLength={120} /></label>
    <label className="text-sm">Postcode *<input className={input} name={`${prefix}.postalCode`} autoComplete={autocomplete("postal-code")} maxLength={30} required /></label>
    <label className="text-sm">Phone *<input className={input} name={`${prefix}.phone`} type="tel" autoComplete={autocomplete("tel")} minLength={5} maxLength={50} required /></label>
  </>;
}
