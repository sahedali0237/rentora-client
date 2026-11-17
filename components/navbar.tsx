"use client";

import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// 1. Define the navigation links in a constant array
const navLinks = [
  { name: "Home", href: "#home" },
  { name: "All Equipment", href: "#equipment" },
  { name: "How It Works", href: "#how-it-works" },
  { name: "Contact", href: "#contact" },
];

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white dark:bg-[#10352c] text-gray-900 dark:text-white shadow-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Left: Logo Only */}
          <Link href="/" className="flex items-center cursor-pointer">
            <Image
              src="/Logo.png"
              alt="Rantore Logo"
              width={350}
              height={250}
              className="h-12 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </Link>

          {/* Center: Desktop Navigation using Map */}
          <div className="hidden lg:flex items-center gap-8 font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="hover:text-[#fdb03d] dark:hover:text-gray-300 transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right: Desktop Auth Buttons */}
          {/* Right: Desktop Auth Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            <button className="font-medium text-gray-900 dark:text-white hover:text-amber-500 dark:hover:text-amber-400 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 active:scale-95 px-4 py-2 rounded-md transition-all duration-200">
              Login
            </button>
            <button className="bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-gray-900 font-semibold px-6 py-2 rounded-md active:scale-95 transition-all duration-200 shadow-sm">
              Register
            </button>
          </div>

          {/* Mobile Hamburger Menu Toggle */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-900 dark:text-white hover:text-[#fdb03d] dark:hover:text-gray-300 focus:outline-none p-2 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-7 w-7" />
              ) : (
                <Menu className="h-7 w-7" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div
        className={`lg:hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen
            ? "max-h-96 opacity-100 py-4 border-t border-gray-200 dark:border-[#1a4a40]"
            : "max-h-0 opacity-0 overflow-hidden"
        } bg-white dark:bg-[#10352c]`}
      >
        <div className="flex flex-col items-center gap-6 font-medium">
          {/* Mobile Navigation using Map */}
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={toggleMenu}
              className="hover:text-[#fdb03d] dark:hover:text-gray-300 w-full text-center transition-colors"
            >
              {link.name}
            </Link>
          ))}

          <div className="flex flex-col items-center gap-4 w-full mt-2 px-6">
            <button className="w-full font-medium hover:text-[#fdb03d] dark:hover:text-gray-300 border border-gray-300 dark:border-white/20 py-2 rounded-md transition-colors">
              Login
            </button>
            <button className="w-full bg-[#fdb03d] hover:bg-[#e09b35] text-black font-semibold py-2 rounded-md transition-colors shadow-sm">
              Register
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
