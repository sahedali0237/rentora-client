import { getPrivacyPolicy } from "@/lib/privacy";
import LegalDocument from "@/components/legal/LegalDocument";

export default async function PrivacyPage() {
  const doc = await getPrivacyPolicy();
  return <LegalDocument doc={doc} title="Privacy Policy" />;
}
