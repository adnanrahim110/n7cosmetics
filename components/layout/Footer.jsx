"use client";

import Link from "next/link";
import { globalContent } from "../../content/global";
import { FaInstagram, FaFacebook, FaTwitter } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-dark-950 border-t border-white/10 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-1">
            <h2 className="font-heading text-2xl text-primary-300 mb-4 tracking-widest uppercase">
              {globalContent.header.logo}
            </h2>
            <p className="text-dark-300 text-sm leading-relaxed mb-6">
              {globalContent.footer.description}
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-dark-300 hover:text-primary-300 transition-colors"><FaInstagram size={20} /></a>
              <a href="#" className="text-dark-300 hover:text-primary-300 transition-colors"><FaFacebook size={20} /></a>
              <a href="#" className="text-dark-300 hover:text-primary-300 transition-colors"><FaTwitter size={20} /></a>
            </div>
          </div>

          <div className="md:col-span-1">
            <h3 className="font-heading text-lg text-primary-100 mb-6 tracking-wide">Quick Links</h3>
            <ul className="space-y-3">
              {globalContent.footer.quickLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-dark-300 hover:text-primary-300 text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-1">
            <h3 className="font-heading text-lg text-primary-100 mb-6 tracking-wide">Customer Care</h3>
            <ul className="space-y-3">
              <li><Link href="/contact" className="text-dark-300 hover:text-primary-300 text-sm transition-colors">Contact Us</Link></li>
              <li><Link href="/faq" className="text-dark-300 hover:text-primary-300 text-sm transition-colors">FAQs</Link></li>
              <li><Link href="/returns" className="text-dark-300 hover:text-primary-300 text-sm transition-colors">Returns & Exchanges</Link></li>
            </ul>
          </div>

          <div className="md:col-span-1">
            <h3 className="font-heading text-lg text-primary-100 mb-6 tracking-wide">Newsletter</h3>
            <p className="text-dark-300 text-sm mb-4">Subscribe to receive updates, access to exclusive deals, and more.</p>
            <form className="flex flex-col space-y-3" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Enter your email address" 
                className="bg-transparent border border-white/20 text-dark-50 px-4 py-3 text-sm focus:outline-none focus:border-primary-400 transition-colors"
                required
              />
              <button 
                type="submit"
                className="bg-primary-500 hover:bg-primary-400 text-dark-950 font-medium px-4 py-3 text-sm tracking-wider uppercase transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-dark-400 text-xs">
            {globalContent.footer.copyright}
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <span className="text-dark-400 text-xs cursor-pointer hover:text-primary-300 transition-colors">Privacy Policy</span>
            <span className="text-dark-400 text-xs cursor-pointer hover:text-primary-300 transition-colors">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
