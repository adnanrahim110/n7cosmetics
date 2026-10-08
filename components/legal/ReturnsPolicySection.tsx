import { LegalSection } from "./LegalPage";

export default function ReturnsPolicySection({ email }: { email: string }) {
  return (
    <LegalSection id="returns" number="02" title="Returns & refunds">
      <h3 className="font-body text-lg font-semibold text-stone-900">Changed your mind?</h3>
      <p>
        You can return unopened, unused items in their original sealed packaging
        within 30 days of receiving them. For hygiene and safety reasons, we
        cannot accept returns of fragrances once the seal has been broken or the
        product has been used, unless the item is faulty.
      </p>
      <h3 className="font-body text-lg font-semibold text-stone-900">How to return an item</h3>
      <ol className="list-decimal space-y-3 border-l border-[#967C55]/45 pl-6 marker:text-[#7a5d38] sm:pl-10">
        <li>
          Email us at{" "}
          <a className="inline-flex min-h-11 items-center rounded text-[#7a5d38] underline underline-offset-4 wrap-anywhere transition-colors hover:text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-700 motion-reduce:transition-none" href={`mailto:${email}`}>
            {email}
          </a>{" "}
          with your order number within 30 days of delivery.
        </li>
        <li>We&apos;ll confirm the return address and next steps.</li>
        <li>
          Pack the item securely and send it back. We recommend a tracked
          service, as returns remain your responsibility until they reach us.
        </li>
      </ol>
      <p>
        Return postage is paid by the customer for change-of-mind returns. Once
        we receive and inspect your return, we&apos;ll refund you to your original
        payment method within 14 days, including the standard delivery charge if
        you return your whole order.
      </p>
      <h3 className="font-body text-lg font-semibold text-stone-900">Damaged, faulty or incorrect items</h3>
      <p>
        If your order arrives damaged, faulty or not as described, please contact
        us as soon as possible with your order number and clear photos of the
        product and packaging. We&apos;ll arrange a replacement or refund and cover
        the return postage.
      </p>
      <p>
        This policy does not affect your statutory rights under the Consumer
        Rights Act 2015.
      </p>
    </LegalSection>
  );
}
