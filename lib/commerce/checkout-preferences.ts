export const checkoutMarketingCopy = {
  title: "Keep me updated",
  introduction: "We’d love to keep you updated by email with N7 Cosmetics news, new fragrance launches, special offers and promotions.",
  checkbox: "Tick this box if you do NOT want to receive marketing emails from N7 Cosmetics.",
  unsubscribe: "You can unsubscribe at any time using the unsubscribe link in our emails.",
  privacy: "For information about how we use your personal data, please see our",
} as const;

// Save the same notice shown at checkout, independently of later copy changes.
export const checkoutMarketingNotice = `${checkoutMarketingCopy.title}\n${checkoutMarketingCopy.introduction}\n${checkoutMarketingCopy.checkbox}\n${checkoutMarketingCopy.unsubscribe} ${checkoutMarketingCopy.privacy} Privacy Policy.`;
