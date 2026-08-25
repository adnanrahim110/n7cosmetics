import { ArrowDown, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { ReactNode } from "react";
import type { PublicSiteSettings } from "@/lib/commerce/settings";

export interface LegalNavigationItem {
  href: `#${string}`;
  label: string;
}

export function LegalPage({
  eyebrow,
  title,
  introduction,
  navigation,
  children,
}: {
  eyebrow: string;
  title: string;
  introduction: string;
  navigation: LegalNavigationItem[];
  children: ReactNode;
}) {
  return (
    <div className="bg-[#f3eee5] text-[#1c1814]">
      <section className="relative isolate min-h-[34rem] overflow-hidden bg-[#0a0a09] px-5 pb-16 pt-40 text-[#f7f0e8] sm:px-8 sm:pb-20 sm:pt-44 lg:px-12 lg:pb-24">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_78%_22%,rgba(150,124,85,0.2),transparent_30%),linear-gradient(118deg,#11100e_0%,#070707_72%,#19150f_145%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-[14%] -z-10 w-px bg-white/[0.04]"
        />
        <div
          aria-hidden="true"
          className="absolute -right-24 bottom-[-12rem] -z-10 size-[34rem] rounded-full border border-[#967C55]/15 sm:size-[44rem]"
        />

        <div className="mx-auto flex min-h-[20rem] max-w-360 flex-col justify-end">
          <div className="flex items-center gap-3 text-[9px] font-semibold uppercase tracking-[0.3em] text-[#b99a6c]">
            <span aria-hidden="true" className="h-px w-9 bg-current" />
            {eyebrow}
          </div>
          <h1 className="mt-6 max-w-5xl break-words font-heading text-[clamp(2.8rem,13vw,4.8rem)] uppercase leading-[0.86] tracking-[-0.035em] sm:text-[clamp(3.4rem,7vw,7.6rem)]">
            {title}
          </h1>
          <div className="mt-8 flex max-w-3xl items-start gap-5 border-t border-white/12 pt-6 sm:items-center">
            <ArrowDown
              aria-hidden="true"
              className="mt-1 size-4 shrink-0 text-[#b99a6c] sm:mt-0"
              strokeWidth={1.4}
            />
            <p className="text-sm font-light leading-7 text-white/55 sm:text-base">
              {introduction}
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-360 gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-20 lg:px-12 lg:py-28">
        <aside className="lg:sticky lg:top-32 lg:h-fit">
          <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[#8d6745]">
            On this page
          </p>
          <nav aria-label="Page contents" className="mt-5 grid border-t border-black/12 sm:grid-cols-2 lg:block">
            {navigation.map((item, index) => (
              <a
                key={item.href}
                className="group flex items-center gap-4 border-b border-black/10 py-4 text-xs font-medium uppercase tracking-[0.12em] text-black/48 transition-colors hover:text-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8d6745]"
                href={item.href}
              >
                <span className="text-[9px] text-[#8d6745]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        <article className="min-w-0 max-w-4xl space-y-16 sm:space-y-20">
          {children}
        </article>
      </div>
    </div>
  );
}

export function LegalSection({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="scroll-mt-32" id={id}>
      <div className="flex items-center gap-4">
        <span className="text-[9px] font-semibold tracking-[0.25em] text-[#8d6745]">
          {number}
        </span>
        <span aria-hidden="true" className="h-px grow bg-black/12" />
      </div>
      <h2 className="mt-6 break-words font-heading text-2xl uppercase leading-tight tracking-[0.015em] sm:text-4xl">
        {title}
      </h2>
      <div className="mt-7 space-y-5 text-[15px] font-light leading-8 text-black/62 sm:text-base">
        {children}
      </div>
    </section>
  );
}

export function LegalList({ children }: { children: ReactNode }) {
  return (
    <ul className="list-disc space-y-3 border-l border-[#967C55]/45 pl-6 marker:text-[#8d6745] sm:pl-10">
      {children}
    </ul>
  );
}

export function LegalContactCard({
  settings,
  title = "Need help?",
  description,
}: {
  settings: PublicSiteSettings;
  title?: string;
  description: string;
}) {
  const email = settings.email || "info@n7cosmetics.co.uk";

  return (
    <div className="border border-black/10 bg-white/35 p-6 sm:p-8">
      <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[#8d6745]">
        Contact N7 Cosmetics
      </p>
      <h3 className="mt-3 font-heading text-2xl uppercase sm:text-3xl">{title}</h3>
      <p className="mt-4 max-w-2xl text-sm font-light leading-7 text-black/55">
        {description}
      </p>
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <a
          className="flex min-w-0 items-center gap-3 border-t border-black/12 pt-4 text-sm text-black/68 transition-colors hover:text-[#8d6745]"
          href={`mailto:${email}`}
        >
          <Mail aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.5} />
          <span className="truncate">{email}</span>
        </a>
        {settings.phone ? (
          <a
            className="flex min-w-0 items-center gap-3 border-t border-black/12 pt-4 text-sm text-black/68 transition-colors hover:text-[#8d6745]"
            href={`tel:${settings.phone}`}
          >
            <Phone aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.5} />
            <span className="min-w-0 break-words">{settings.phone}</span>
          </a>
        ) : null}
        {settings.whatsapp ? (
          <a
            className="flex min-w-0 items-center gap-3 border-t border-black/12 pt-4 text-sm text-black/68 transition-colors hover:text-[#8d6745]"
            href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`}
          >
            <MessageCircle aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.5} />
            <span className="min-w-0 break-words">WhatsApp {settings.whatsapp}</span>
          </a>
        ) : null}
        {settings.address ? (
          <div className="flex items-start gap-3 border-t border-black/12 pt-4 text-sm leading-6 text-black/68">
            <MapPin aria-hidden="true" className="mt-1 size-4 shrink-0" strokeWidth={1.5} />
            <span className="whitespace-pre-line">{settings.address}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
