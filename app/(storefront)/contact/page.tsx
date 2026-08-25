import type { Metadata } from "next";
import {
  ArrowDown,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import ContactForm from "@/components/contact/ContactForm";
import FeaturesStrip from "@/components/sections/FeaturesStrip";
import SocialMediaLinks from "@/components/ui/SocialMediaLinks";
import { getPublicSiteSettings } from "@/lib/commerce/settings";

export const metadata: Metadata = {
  title: "Contact N7 Cosmetics | Customer Care",
  description:
    "Contact N7 Cosmetics for order support, delivery and return questions, product advice, or business enquiries.",
};

export default async function ContactPage() {
  const settings = await getPublicSiteSettings();
  const whatsappNumber = settings.whatsapp?.replace(/\D/g, "") ?? "";

  return (
    <>
      <div className="bg-[#f3eee5] text-[#1c1814]">
        <section className="relative isolate min-h-[38rem] overflow-hidden bg-[#090908] px-5 pb-16 pt-40 text-[#f7f0e8] sm:px-8 sm:pb-20 sm:pt-44 lg:px-12 lg:pb-24">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_82%_28%,rgba(150,124,85,0.23),transparent_30%),linear-gradient(118deg,#11100e_0%,#070707_70%,#1b160f_145%)]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-y-0 left-[14%] -z-10 w-px bg-white/[0.04]"
          />
          <div
            aria-hidden="true"
            className="absolute -right-28 -top-44 -z-10 size-[34rem] rounded-full border border-[#967C55]/15 sm:size-[46rem]"
          />
          <div
            aria-hidden="true"
            className="absolute bottom-10 right-[8%] -z-10 font-heading text-[clamp(10rem,24vw,24rem)] leading-none text-white/[0.025]"
          >
            07
          </div>

          <div className="mx-auto flex min-h-[23rem] max-w-360 flex-col justify-end">
            <div className="flex items-center gap-3 text-[9px] font-semibold uppercase tracking-[0.3em] text-[#b99a6c]">
              <span aria-hidden="true" className="h-px w-9 bg-current" />
              Customer care
            </div>
            <h1 className="mt-6 max-w-6xl font-heading text-[clamp(3.2rem,15vw,5.5rem)] uppercase leading-[0.84] tracking-[-0.045em] sm:text-[clamp(4rem,9vw,9rem)]">
              Let&apos;s talk
            </h1>
            <div className="mt-8 flex max-w-3xl items-start gap-5 border-t border-white/12 pt-6 sm:items-center">
              <ArrowDown
                aria-hidden="true"
                className="mt-1 size-4 shrink-0 text-[#b99a6c] sm:mt-0"
                strokeWidth={1.4}
              />
              <p className="text-sm font-light leading-7 text-white/55 sm:text-base">
                Need assistance with an order, a fragrance, or a return? Send a
                message and it will go directly to the N7 Cosmetics team.
              </p>
            </div>
          </div>
        </section>

        <section className="px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-28">
          <div className="mx-auto grid max-w-360 gap-10 sm:gap-14 lg:grid-cols-[minmax(17rem,0.72fr)_minmax(0,1.28fr)] lg:gap-20 xl:gap-28">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[#8d6745]">
                Contact details
              </p>
              <h2 className="mt-5 max-w-md font-heading text-4xl uppercase leading-[0.96] tracking-[-0.02em] sm:text-5xl">
                Our team is here to help
              </h2>
              <p className="mt-6 max-w-md text-sm font-light leading-7 text-black/52">
                Choose the contact method that suits you, or use the form for a
                detailed enquiry. The information below is maintained through
                the store administration area.
              </p>

              <div className="mt-10 border-t border-black/12">
                {settings.email ? (
                  <a
                    className="group flex items-start gap-4 border-b border-black/10 py-5 transition-colors hover:text-[#8d6745]"
                    href={`mailto:${settings.email}`}
                  >
                    <Mail aria-hidden="true" className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} />
                    <span className="min-w-0">
                      <span className="block text-[9px] font-semibold uppercase tracking-[0.2em] text-black/35">
                        Email
                      </span>
                      <span className="mt-1 block break-all text-sm">{settings.email}</span>
                    </span>
                  </a>
                ) : null}
                {settings.phone ? (
                  <a
                    className="group flex items-start gap-4 border-b border-black/10 py-5 transition-colors hover:text-[#8d6745]"
                    href={`tel:${settings.phone}`}
                  >
                    <Phone aria-hidden="true" className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} />
                    <span>
                      <span className="block text-[9px] font-semibold uppercase tracking-[0.2em] text-black/35">
                        Phone
                      </span>
                      <span className="mt-1 block text-sm">{settings.phone}</span>
                    </span>
                  </a>
                ) : null}
                {settings.whatsapp && whatsappNumber ? (
                  <a
                    className="group flex items-start gap-4 border-b border-black/10 py-5 transition-colors hover:text-[#8d6745]"
                    href={`https://wa.me/${whatsappNumber}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <MessageCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} />
                    <span>
                      <span className="block text-[9px] font-semibold uppercase tracking-[0.2em] text-black/35">
                        WhatsApp
                      </span>
                      <span className="mt-1 block text-sm">{settings.whatsapp}</span>
                    </span>
                  </a>
                ) : null}
                {settings.address ? (
                  <div className="flex items-start gap-4 border-b border-black/10 py-5">
                    <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} />
                    <span>
                      <span className="block text-[9px] font-semibold uppercase tracking-[0.2em] text-black/35">
                        Address
                      </span>
                      <span className="mt-1 block whitespace-pre-line text-sm leading-6">
                        {settings.address}
                      </span>
                    </span>
                  </div>
                ) : null}
              </div>

              {settings.socialLinks.length ? (
                <div className="mt-8">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-black/35">
                    Follow N7 Cosmetics
                  </p>
                  <SocialMediaLinks
                    className="mt-4 flex flex-wrap gap-3"
                    iconSize={17}
                    linkClassName="grid size-11 place-items-center rounded-full border border-black/15 transition hover:border-[#8d6745] hover:bg-[#8d6745] hover:text-white"
                    links={settings.socialLinks}
                  />
                </div>
              ) : null}
            </div>

            <div className="min-w-0 border border-black/10 bg-white/38 p-5 shadow-[0_28px_70px_rgba(55,42,25,0.08)] sm:p-9 lg:p-11">
              <div className="mb-9 border-b border-black/10 pb-7">
                <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[#8d6745]">
                  Send an enquiry
                </p>
                <h2 className="mt-3 font-heading text-3xl uppercase sm:text-4xl">
                  How can we help?
                </h2>
                <p className="mt-3 max-w-2xl text-sm font-light leading-7 text-black/48">
                  Complete the form below and your message will be delivered to
                  the contact email configured by the N7 Cosmetics team.
                </p>
              </div>
              <ContactForm enabled={Boolean(settings.email)} />
            </div>
          </div>
        </section>
      </div>
      <FeaturesStrip />
    </>
  );
}
