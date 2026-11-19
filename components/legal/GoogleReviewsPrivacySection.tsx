import { LegalSection } from "./LegalPage";

export default function GoogleReviewsPrivacySection() {
  return <LegalSection id="google-reviews" number="08" title="Google Customer Reviews and store widget">
    <p>When Google Customer Reviews is enabled, our successful order confirmation page shares your order reference, order email address, delivery country and estimated delivery date with Google to display its review invitation. The email address is sent in its original form, rather than as an advertising matching hash. Card details, street addresses, phone numbers and payment or receipt credentials are not included in this review invitation.</p>
    <p>You choose in Google’s invitation whether to receive a purchase-experience survey after delivery. This choice is separate from our newsletter preferences and permission for Meta or TikTok advertising measurement. A display marker in this tab’s session storage helps prevent repeating an invitation that has already appeared; the marker contains no email address or payment credentials.</p>
    <p>The optional Google store widget displays ratings and store-quality information supplied by Google on browsing pages. Google receives browser and network information when its services load and collects aggregated widget views and interactions. See <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="underline underline-offset-4">Google’s privacy policy</a> and <a href="https://support.google.com/merchants/answer/14629305?hl=en" target="_blank" rel="noreferrer" className="underline underline-offset-4">how Google Customer Reviews works</a>.</p>
  </LegalSection>;
}
