import type { Metadata } from "next";
import TermsPage from "./TermsPage";

export const metadata: Metadata = {
  title: "Terms & Conditions | Rentora",
};

export default function TermsPageShell() {
  return (
    <div className="min-h-screen font-(family-name:--font-inter) bg-[#F5F6F3] dark:bg-[#10352c] text-[#10161F] dark:text-white antialiased">
      <TermsPage />
    </div>
  );
}
