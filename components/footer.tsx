"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaFacebook, FaInstagram, FaLinkedin } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { FiMail, FiPhone, FiMapPin, FiArrowUpRight } from "react-icons/fi";

const footerLinks = {
  Explore: [
    { name: "Home", href: "/" },
    { name: "All Equipment", href: "/equipment" },
    { name: "How It Works", href: "/how-it-works" },
    { name: "About Us", href: "/about" },
  ],
  Categories: [
    { name: "Construction", href: "/equipment?category=Construction" },
    { name: "Photography", href: "/equipment?category=Photography" },
    { name: "Vehicles", href: "/equipment?category=Vehicles" },
    { name: "Agriculture", href: "/equipment?category=Agriculture" },
    { name: "Electronics", href: "/equipment?category=Electronics" },
  ],
  Support: [
    { name: "Contact Us", href: "/contact" },
    { name: "Help Center", href: "/contact" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms & Conditions", href: "/terms" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white text-gray-600 transition-colors duration-300 dark:border-[#1a4a40] dark:bg-[#10352c] dark:text-gray-300">
      {/* Main Footer */}
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand & Contact */}
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center cursor-pointer">
              <Image
                src="/Logo.png"
                alt="Rentora Logo"
                width={350}
                height={250}
                className="h-12 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </Link>

            <p className="mt-5 text-sm leading-7 text-gray-500 dark:text-gray-300">
              Rent the right equipment for your next project. Discover quality
              equipment from trusted owners and enjoy flexible, secure rentals.
            </p>

            {/* Contact */}
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <FiMail className="h-4 w-4 text-amber-500" />
                <a
                  href="mailto:hello@rentora.com"
                  className="transition-colors hover:text-amber-500 dark:hover:text-amber-400"
                >
                  hello@rentora.com
                </a>
              </div>

              <div className="flex items-center gap-3">
                <FiPhone className="h-4 w-4 text-amber-500" />
                <a
                  href="tel:+8801234567890"
                  className="transition-colors hover:text-amber-500 dark:hover:text-amber-400"
                >
                  +880 1234-567890
                </a>
              </div>

              <div className="flex items-center gap-3">
                <FiMapPin className="h-4 w-4 shrink-0 text-amber-500" />
                <span>Dhaka, Bangladesh</span>
              </div>
            </div>

            {/* Social Icons */}
            <div className="mt-7 flex items-center gap-3">
              <SocialLink href="#" label="Facebook">
                <FaFacebook className="h-4 w-4" />
              </SocialLink>

              <SocialLink href="#" label="Instagram">
                <FaInstagram className="h-4 w-4" />
              </SocialLink>

              <SocialLink href="#" label="LinkedIn">
                <FaLinkedin className="h-4 w-4" />
              </SocialLink>

              <SocialLink href="#" label="X">
                <FaXTwitter className="h-4 w-4" />
              </SocialLink>
            </div>
          </div>

          {/* Explore */}
          <FooterColumn title="Explore" links={footerLinks.Explore} />

          {/* Categories */}
          <FooterColumn title="Categories" links={footerLinks.Categories} />

          {/* Support */}
          <FooterColumn title="Support" links={footerLinks.Support} />
        </div>

        {/* Newsletter */}
        <div className="mt-14 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm dark:border-[#1a4a40] dark:bg-[#0c2922] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-lg">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500">
                Stay in the loop
              </p>

              <h3 className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
                Get the latest from Rentora
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-300">
                New equipment, rental tips, and useful updates delivered
                straight to your inbox.
              </p>
            </div>

            <form className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
              <input
                type="email"
                placeholder="Enter your email"
                className="h-11 min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-[#1a4a40] dark:bg-[#10352c] dark:text-white dark:placeholder:text-gray-400"
              />

              <button
                type="submit"
                className="group flex h-11 items-center justify-center gap-2 rounded-md bg-[#fdb03d] px-5 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#e09b35] active:bg-[#c98a2d] active:scale-95 shadow-sm"
              >
                Subscribe
                <FiArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200 dark:border-[#1a4a40]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-6 text-xs text-gray-500 dark:text-gray-400 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>
            © <CurrentDate />
            <span className="font-semibold text-gray-900 dark:text-white">
              Rentora
            </span>
            . All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-5">
            <Link
              href="/privacy"
              className="transition-colors hover:text-amber-500 dark:hover:text-amber-400"
            >
              Privacy
            </Link>

            <Link
              href="/terms"
              className="transition-colors hover:text-amber-500 dark:hover:text-amber-400"
            >
              Terms
            </Link>

            <span className="hidden h-3 w-px bg-gray-300 dark:bg-gray-600 sm:block" />

            <p>
              Built with <span className="font-semibold text-amber-500">♥</span>{" "}
              for Rentora
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ----------------------------- */
/* Current Date                   */
/* ----------------------------- */

const emptySubscribe = () => () => {};

const getClientDate = () =>
  new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const getServerDate = () => "";

function CurrentDate() {
  const date = useSyncExternalStore(
    emptySubscribe,
    getClientDate,
    getServerDate,
  );

  if (!date) return null;

  return <>{date} </>;
}

/* ----------------------------- */
/* Footer Column                  */
/* ----------------------------- */

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { name: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-sm font-bold text-gray-900 dark:text-white">
        {title}
      </h3>

      <ul className="mt-5 space-y-3">
        {links.map((link) => (
          <li key={link.name}>
            <Link
              href={link.href}
              className="group inline-flex items-center gap-1 text-sm text-gray-500 transition-colors duration-200 hover:text-amber-500 dark:text-gray-300 dark:hover:text-amber-400"
            >
              {link.name}

              <FiArrowUpRight className="h-3 w-3 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ----------------------------- */
/* Social Link                    */
/* ----------------------------- */

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-all duration-300 hover:-translate-y-1 hover:border-[#fdb03d] hover:bg-[#fdb03d] hover:text-black dark:border-[#1a4a40] dark:bg-[#10352c] dark:text-gray-300 dark:hover:border-[#fdb03d] dark:hover:bg-[#fdb03d] dark:hover:text-black"
    >
      {children}
    </a>
  );
}
