import { getTerms } from "@/lib/terms";
import LegalDocument from "@/components/legal/LegalDocument";

export default async function TermsPage() {
  const doc = await getTerms();
  return (
    <LegalDocument
      doc={doc}
      title="Terms & Conditions"
      contactTitle="Questions about these terms?"
      contactText="If you have questions about these terms or your account, our support team is happy to help."
      related={{ href: "/privacy", label: "Privacy Policy" }}
    />
  );
}
