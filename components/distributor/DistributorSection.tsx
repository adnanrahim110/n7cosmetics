import type { ReactNode } from "react";

interface DistributorSectionProps {
  id: string;
  title: string;
  children: ReactNode;
}

export default function DistributorSection({
  id,
  title,
  children,
}: DistributorSectionProps) {
  return (
    <section
      aria-labelledby={`${id}-title`}
      className="min-w-0 scroll-mt-32 border-t border-primary-200 pt-8 sm:pt-12"
      id={id}
    >
      <h2
        className="text-2xl leading-snug tracking-normal text-primary-900 sm:text-3xl"
        id={`${id}-title`}
      >
        {title}
      </h2>
      <div className="mt-6 space-y-4 text-base leading-8 text-dark-700">
        {children}
      </div>
    </section>
  );
}
