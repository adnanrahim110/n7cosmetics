"use client";

import Image from "next/image";
import Link from "next/link";
import { FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa";
import { globalContent } from "../../content/global";

export default function Footer() {
  return (
    <footer
      className="relative h-[85vh] min-h-160 bg-[#050505] overflow-hidden"
      style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
    >
      <div className="fixed bottom-0 left-0 w-full h-[85vh] min-h-160 bg-[#050505] flex flex-col justify-between pt-24 z-0">
        <div className="w-full max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-16 lg:gap-8 grow">
          <div className="md:col-span-4 flex flex-col justify-start items-start">
            <Image
              width={400}
              height={600}
              src={globalContent.header.logo}
              alt={globalContent.header.name}
              className="h-42 w-auto mb-6"
            />
            <p className="text-white/50 text-sm font-light mb-8 max-w-sm">
              {globalContent.footer.description}
            </p>
          </div>

          <div className="md:col-span-2 flex flex-col">
            <h4 className="text-[#967C55] text-[10px] tracking-[0.3em] uppercase mb-6 font-medium">
              Explore
            </h4>
            <ul className="space-y-5">
              {globalContent.header.navigation.slice(0, 4).map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="group relative inline-block text-white/60 hover:text-white text-[13px] tracking-widest uppercase transition-colors pb-1"
                  >
                    {link.label}
                    <span className="absolute left-0 bottom-0 w-full h-px bg-[#967C55] scale-x-0 origin-right transition-transform duration-500 ease-[cubic-bezier(0.86,0,0.07,1)] group-hover:scale-x-100 group-hover:origin-left" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2 flex flex-col">
            <h4 className="text-[#967C55] text-[10px] tracking-[0.3em] uppercase mb-6 font-medium">
              Discover
            </h4>
            <ul className="space-y-5">
              {globalContent.header.navigation.slice(4).map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="group relative inline-block text-white/60 hover:text-white text-[13px] tracking-widest uppercase transition-colors pb-1"
                  >
                    {link.label}
                    <span className="absolute left-0 bottom-0 w-full h-px bg-[#967C55] scale-x-0 origin-right transition-transform duration-500 ease-[cubic-bezier(0.86,0,0.07,1)] group-hover:scale-x-100 group-hover:origin-left" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4 flex flex-col justify-start">
            <h3 className="font-heading text-3xl text-white tracking-wider uppercase mb-2">
              Join the Inner Circle
            </h3>
            <p className="text-white/50 text-sm font-light mb-8 max-w-lg">
              Subscribe to receive exclusive access to new releases, private
              events, and masterclasses.
            </p>
            <form
              className="flex w-full max-w-md border-b border-white/20 pb-3 relative group"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="EMAIL ADDRESS"
                className="bg-transparent w-full text-white placeholder-white/30 text-xs tracking-[0.2em] uppercase focus:outline-none"
                required
              />
              <button
                type="submit"
                className="text-[#967C55] text-xs font-medium tracking-widest uppercase hover:text-white transition-colors absolute right-0 bottom-3"
              >
                Submit
              </button>
              <div className="absolute -bottom-px left-0 w-0 h-px bg-[#967C55] transition-all duration-500 group-focus-within:w-full" />
            </form>
          </div>
        </div>

        <div className="w-full px-4 sm:px-6 lg:px-8 mt-auto flex flex-col items-center">
          <div className="w-full flex flex-col md:flex-row justify-between items-center md:items-end border-b border-white/10 pb-4 mb-2 gap-6 md:gap-0">
            <div className="flex space-x-8">
              <a
                href="#"
                className="text-white/40 hover:text-[#967C55] transition-colors"
              >
                <FaInstagram size={18} />
              </a>
              <a
                href="#"
                className="text-white/40 hover:text-[#967C55] transition-colors"
              >
                <FaFacebook size={18} />
              </a>
              <a
                href="#"
                className="text-white/40 hover:text-[#967C55] transition-colors"
              >
                <FaTwitter size={18} />
              </a>
            </div>

            <p className="text-white/30 text-[10px] uppercase tracking-widest text-center md:text-left">
              {globalContent.footer.copyright}
            </p>

            <div className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2 text-center md:text-right">
              <Link
                href="/contact"
                className="group relative inline-block text-white/30 hover:text-white text-[10px] uppercase tracking-widest transition-colors pb-1"
              >
                Contact Us
                <span className="absolute left-0 bottom-0 w-full h-px bg-[#967C55] scale-x-0 origin-right transition-transform duration-500 ease-[cubic-bezier(0.86,0,0.07,1)] group-hover:scale-x-100 group-hover:origin-left" />
              </Link>
              <Link
                href="/shipping-returns"
                className="group relative inline-block text-white/30 hover:text-white text-[10px] uppercase tracking-widest transition-colors pb-1"
              >
                Shipping & Returns
                <span className="absolute left-0 bottom-0 w-full h-px bg-[#967C55] scale-x-0 origin-right transition-transform duration-500 ease-[cubic-bezier(0.86,0,0.07,1)] group-hover:scale-x-100 group-hover:origin-left" />
              </Link>
              <Link
                href="/privacy"
                className="group relative inline-block text-white/30 hover:text-white text-[10px] uppercase tracking-widest transition-colors pb-1"
              >
                Privacy Policy
                <span className="absolute left-0 bottom-0 w-full h-px bg-[#967C55] scale-x-0 origin-right transition-transform duration-500 ease-[cubic-bezier(0.86,0,0.07,1)] group-hover:scale-x-100 group-hover:origin-left" />
              </Link>
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
