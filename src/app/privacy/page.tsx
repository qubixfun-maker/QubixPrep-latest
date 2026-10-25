import type { Metadata } from "next"
import { LegalPage } from "@/components/legal/legal-page"
import { PrivacyContent } from "@/components/legal/privacy-content"

export const metadata: Metadata = { title: "Privacy Policy | QubixPrep" }

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <PrivacyContent />
    </LegalPage>
  )
}
