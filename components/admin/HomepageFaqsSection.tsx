import { faqLimits } from "@/lib/homepage/faqs";
import type { FaqsContent } from "@/lib/homepage/types";
import FaqsEditor from "./FaqsEditor";
import HomepageContentBlock from "./HomepageContentBlock";

interface HomepageFaqsSectionProps {
  content: FaqsContent;
  action: (formData: FormData) => void | Promise<void>;
  defaultOpen?: boolean;
}

const headings = [
  { name: "eyebrow", label: "Eyebrow", maxLength: faqLimits.eyebrow, required: true },
  { name: "titleLead", label: "Title", maxLength: faqLimits.title, required: true },
  { name: "titleAccent", label: "Accent title (optional)", maxLength: faqLimits.title, required: false },
] as const;
const input = "mt-1 min-h-11 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm leading-6 text-zinc-950 focus-visible:ring-2 focus-visible:ring-amber-700";

export default function HomepageFaqsSection({ content, action, defaultOpen }: HomepageFaqsSectionProps) {
  return (
    <HomepageContentBlock action={action} defaultOpen={defaultOpen} description="Section heading and questions shown immediately before the service features strip." id="faqs" title="FAQs">
      <div className="grid min-w-0 gap-4 sm:col-span-2 md:grid-cols-3">
        {headings.map((field) => (
          <label className="block min-w-0 text-sm font-medium text-zinc-700" key={field.name}>
            {field.label}
            <input className={input} defaultValue={content[field.name]} maxLength={field.maxLength} name={field.name} required={field.required} />
          </label>
        ))}
      </div>
      <label className="block min-w-0 text-sm font-medium text-zinc-700 sm:col-span-2">
        Description (optional)
        <textarea className={input} defaultValue={content.description} maxLength={faqLimits.description} name="description" rows={3} />
      </label>
      <div className="min-w-0 sm:col-span-2">
        <FaqsEditor defaultItems={content.items} />
      </div>
    </HomepageContentBlock>
  );
}
