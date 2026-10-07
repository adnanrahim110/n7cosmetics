import FaqAccordion from "@/components/ui/FaqAccordion";
import Title from "@/components/ui/Title";
import type { FaqsContent } from "@/lib/homepage/types";

export default function FaqsSection({ content }: { content: FaqsContent }) {
  if (!content.items.length) return null;

  return (
    <section
      aria-labelledby="home-faqs-title"
      className="bg-primary-100 py-16 text-[#1C1814] sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="flex items-center justify-center gap-4 font-body text-xs font-semibold uppercase tracking-[0.24em] wrap-anywhere text-[#77613F]">
            <span
              aria-hidden="true"
              className="h-px w-8 shrink-0 bg-[#967C55]/60"
            />
            {content.eyebrow}
            <span
              aria-hidden="true"
              className="h-px w-8 shrink-0 bg-[#967C55]/60"
            />
          </p>
          <Title
            className="mt-4 wrap-anywhere uppercase"
            highlight={content.titleAccent}
            highlightClassName="lowercase"
            id="home-faqs-title"
            text={`${content.titleLead} ${content.titleAccent}`.trim()}
            tone="ink"
            variant="section"
          />
          {content.description ? (
            <p className="mx-auto mt-2 max-w-3xl font-body text-sm font-light leading-7 whitespace-pre-line wrap-anywhere text-dark-600 sm:text-base">
              {content.description}
            </p>
          ) : null}
        </div>
        <div className="mx-auto mt-8 max-w-5xl sm:mt-12 lg:mt-16">
          <FaqAccordion items={content.items} />
        </div>
      </div>
    </section>
  );
}
