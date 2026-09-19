import { contactEmail, type ContactEmailInput } from "../email/templates";
import type { EmailBrand } from "../email/layout";
export { escapeEmailHtml } from "../email/layout";
export type { ContactEmailInput } from "../email/templates";
export type { EmailContent as ContactEmailContent } from "../email/layout";

export function buildContactEmail(input: ContactEmailInput, brand: EmailBrand = { appUrl: "https://n7.eluvaire.com" }) {
  return contactEmail(brand, input);
}
