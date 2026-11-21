import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { HowItWorks } from "./HowItWorks";

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
  title: "How it works | Rentora",
  description:
    "Rentora connects people who need equipment with owners who have it. Pick your dates, pay securely, and you're booked.",
};

export default function HowItWorksPage() {
  return (
    <div
      className={`${spaceGrotesk.variable} ${inter.variable} font-[family-name:var(--font-inter)] bg-[#F5F6F3] dark:bg-[#10352c] text-[#10161F] dark:text-white`}
    >
      <HowItWorks />
    </div>
  );
}
