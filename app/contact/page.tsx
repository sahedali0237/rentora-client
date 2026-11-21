import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { ContactPage } from "./ContactPage";

const spaceGrotesk = Space_Grotesk({
  weight: ["500", "700"],
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const inter = Inter({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Contact Rentora | Equipment Rental Marketplace",
  description:
    "Have questions about Rentora? Get in touch with our team for rental support, booking assistance, equipment listings, and general inquiries.",
};

export default function ContactPageShell() {
  return (
    <div
      className={`${spaceGrotesk.variable} ${inter.variable} font-[family-name:var(--font-inter)] bg-[#F5F6F3] dark:bg-[#10352c] text-[#10161F] dark:text-white`}
    >
      <ContactPage />
    </div>
  );
}
