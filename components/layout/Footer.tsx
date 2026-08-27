"use client";

import SocialMediaLinks from "@/components/ui/SocialMediaLinks";
import Title from "@/components/ui/Title";
import type { NavigationItem } from "@/content/global";
import type { FooterContent } from "@/lib/homepage/types";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { globalContent } from "../../content/global";
import type { PublicSiteSettings } from "../../lib/commerce/settings";

export default function Footer({
  settings = { socialLinks: [] },
  content,
  navigation,
}: {
  settings?: PublicSiteSettings;
  content: FooterContent;
  navigation: NavigationItem[];
}) {
  return (
    <footer className="relative min-h-160 overflow-hidden bg-[#050505]">
      <div className="relative flex min-h-160 w-full flex-col justify-between bg-[#050505] pt-16 sm:pt-20 lg:pt-24">
        <div className="mx-auto grid w-full max-w-[100rem] grow grid-cols-1 gap-x-8 gap-y-14 px-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:px-8">
          <div className="flex flex-col items-start justify-start sm:col-span-2 lg:col-span-4">
            <Image
              width={400}
              height={600}
              src={globalContent.header.logo}
              alt={globalContent.header.name}
              className="mb-6 h-32 w-auto sm:h-36 lg:h-42"
            />
            <p className="text-white/50 text-sm font-light mb-8 max-w-sm">
              {content.description}
            </p>
          </div>

          <div className="flex flex-col lg:col-span-2">
            <h4 className="text-[#967C55] text-[10px] tracking-[0.3em] uppercase mb-6 font-medium">
              Explore
            </h4>
            <ul className="space-y-5">
              {navigation.slice(0, 4).map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href === "/sale" ? link.items?.[0]?.href ?? "#" : link.href}
                    className="group relative inline-block text-white/60 hover:text-white text-[13px] tracking-widest uppercase transition-colors pb-1"
                  >
                    {link.label}
                    <span className="absolute left-0 bottom-0 w-full h-px bg-[#967C55] scale-x-0 origin-right transition-transform duration-500 ease-[cubic-bezier(0.86,0,0.07,1)] group-hover:scale-x-100 group-hover:origin-left" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col lg:col-span-2">
            <h4 className="text-[#967C55] text-[10px] tracking-[0.3em] uppercase mb-6 font-medium">
              Discover
            </h4>
            <ul className="space-y-5">
              {navigation.slice(4).map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href === "/sale" ? link.items?.[0]?.href ?? "#" : link.href}
                    className="group relative inline-block text-white/60 hover:text-white text-[13px] tracking-widest uppercase transition-colors pb-1"
                  >
                    {link.label}
                    <span className="absolute left-0 bottom-0 w-full h-px bg-[#967C55] scale-x-0 origin-right transition-transform duration-500 ease-[cubic-bezier(0.86,0,0.07,1)] group-hover:scale-x-100 group-hover:origin-left" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col justify-start sm:col-span-2 lg:col-span-4">
            <Title
              as="h3"
              className="mb-2 uppercase text-white"
              text={content.newsletterTitle}
              tone="custom"
              variant="small"
            />
            <p className="text-white/50 text-sm font-light mb-8 max-w-lg">
              {content.newsletterDescription}
            </p>
            <form
              className="flex w-full max-w-md border-b border-white/20 pb-3 relative group"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder={content.newsletterPlaceholder}
                className="w-full bg-transparent pr-24 text-xs uppercase tracking-[0.16em] text-white placeholder-white/30 focus:outline-none sm:tracking-[0.2em]"
                required
              />
              <button
                type="submit"
                className="text-[#967C55] text-xs font-medium tracking-widest uppercase hover:text-white transition-colors absolute right-0 bottom-3"
              >
                {content.newsletterButtonLabel}
              </button>
              <div className="absolute -bottom-px left-0 w-0 h-px bg-[#967C55] transition-all duration-500 group-focus-within:w-full" />
            </form>
            {settings.address || settings.phone || settings.email ? (
              <div className="mt-8 w-full max-w-md">
                <div className="flex items-center gap-4">
                  <p className="shrink-0 text-[8px] font-medium uppercase tracking-[0.3em] text-[#967C55]">
                    Quick assistance
                  </p>
                  <span className="h-px grow bg-linear-to-r from-[#967C55]/35 to-transparent" />
                </div>
                <div
                  className={`mt-4 grid border-y border-white/10 bg-white/[0.018] ${settings.address && (settings.phone || settings.email) ? "sm:grid-cols-[0.88fr_1.12fr]" : "grid-cols-1"}`}
                >
                  {settings.address ? (
                    <div
                      className={`relative px-4 py-4 ${settings.phone || settings.email ? "border-b border-white/10 sm:border-b-0 sm:border-r" : ""}`}
                    >
                      <span className="absolute inset-y-4 left-0 w-px bg-[#967C55]/55" />
                      <p className="text-[7px] font-semibold uppercase tracking-[0.25em] text-white/28">
                        Visit
                      </p>
                      <p className="mt-2 max-w-sm whitespace-pre-line text-[13px] leading-5 text-white/58">
                        {settings.address}
                      </p>
                    </div>
                  ) : null}
                  {settings.phone || settings.email ? (
                    <div className="divide-y divide-white/10">
                      {settings.phone ? (
                        <a
                          className="group/contact flex min-h-14 items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-white/[0.035]"
                          href={`tel:${settings.phone}`}
                        >
                          <span>
                            <span className="block text-[7px] font-semibold uppercase tracking-[0.25em] text-white/28">
                              Call
                            </span>
                            <span className="mt-1.5 block text-[12px] tracking-[0.04em] text-white/62 transition-colors group-hover/contact:text-[#c19a6b]">
                              {settings.phone}
                            </span>
                          </span>
                          <ArrowUpRight
                            className="size-3.5 shrink-0 text-[#967C55]/65 transition-transform duration-300 group-hover/contact:-translate-y-0.5 group-hover/contact:translate-x-0.5 group-hover/contact:text-[#c19a6b]"
                            strokeWidth={1.3}
                          />
                        </a>
                      ) : null}
                      {settings.email ? (
                        <a
                          className="group/contact flex min-h-14 items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-white/[0.035]"
                          href={`mailto:${settings.email}`}
                        >
                          <span className="min-w-0">
                            <span className="block text-[7px] font-semibold uppercase tracking-[0.25em] text-white/28">
                              Email
                            </span>
                            <span className="mt-1.5 block truncate text-[12px] tracking-wide text-white/62 transition-colors group-hover/contact:text-[#c19a6b]">
                              {settings.email}
                            </span>
                          </span>
                          <ArrowUpRight
                            className="size-3.5 shrink-0 text-[#967C55]/65 transition-transform duration-300 group-hover/contact:-translate-y-0.5 group-hover/contact:translate-x-0.5 group-hover/contact:text-[#c19a6b]"
                            strokeWidth={1.3}
                          />
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-auto flex w-full flex-col items-center px-4 pt-8 sm:px-6 sm:pt-10 lg:px-8">
          <div className="w-full flex flex-col md:flex-row justify-between items-center md:items-end border-b border-white/10 pb-4 mb-2 gap-6 md:gap-0">
            <SocialMediaLinks
              className="flex gap-8"
              linkClassName="text-white/40 transition-colors hover:text-[#967C55]"
              links={settings.socialLinks}
            />

            <p className="text-white/30 text-[10px] uppercase tracking-widest text-center md:text-left">
              {content.copyright}
            </p>

            <div className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2 text-center md:text-right">
              {content.legalLinks.map((item) => (
                <Link
                  href={item.href}
                  className="group relative inline-block text-white/30 hover:text-white text-[10px] uppercase tracking-widest transition-colors pb-1"
                  key={`${item.label}-${item.href}`}
                >
                  {item.label}
                  <span className="absolute left-0 bottom-0 w-full h-px bg-[#967C55] scale-x-0 origin-right transition-transform duration-500 ease-[cubic-bezier(0.86,0,0.07,1)] group-hover:scale-x-100 group-hover:origin-left" />
                </Link>
              ))}
            </div>
          </div>

          <svg
            className="w-full h-auto opacity-[0.05] pointer-events-none select-none"
            viewBox="0 0 1000 130"
          >
            <text
              x="0"
              y="120"
              fill="white"
              className="font-body"
              style={{ fontSize: "136px", fontWeight: "900" }}
              textLength="1000"
              lengthAdjust="spacing"
            >
              N7 COSMETICS
            </text>
          </svg>
        </div>
      </div>
    </footer>
  );
}
