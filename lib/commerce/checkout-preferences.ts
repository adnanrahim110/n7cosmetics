export const checkoutMarketingCopy = {
  title: "Contact Information",
  introduction: "We’ll send your order confirmation to this email.",
  checkbox: "Email me exclusive offers, new fragrance launches and special deals. (Optional)",
  unsubscribe: "You can unsubscribe at any time using the unsubscribe link in our emails.",
  privacy: "For information about how we use your personal data, please see our",
} as const;

// Save the same notice shown at checkout, independently of later copy changes.
export const checkoutMarketingNotice = `${checkoutMarketingCopy.title}\n${checkoutMarketingCopy.introduction}\n${checkoutMarketingCopy.checkbox}\n${checkoutMarketingCopy.unsubscribe} ${checkoutMarketingCopy.privacy} Privacy Policy.`;
