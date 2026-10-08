import Link from "next/link";
import { LegalSection } from "./LegalPage";

export default function PrivacyMarketingSection() {
  return (
    <LegalSection id="marketing" number="03" title="Privacy & marketing">
      <p>
        We only send marketing emails if you choose to receive them. You can opt
        in at checkout or by subscribing to our newsletter, and unsubscribe at
        any time. See our{" "}
        <Link className="inline-flex min-h-11 items-center rounded text-[#7a5d38] underline underline-offset-4 transition-colors hover:text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-700 motion-reduce:transition-none" href="/privacy">
          Privacy Policy
        </Link>{" "}
        for how we use your data.
      </p>
    </LegalSection>
  );
}
