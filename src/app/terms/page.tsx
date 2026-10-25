import type { Metadata } from "next"
import { LegalPage } from "@/components/legal/legal-page"
import { TermsContent } from "@/components/legal/terms-content"

export const metadata: Metadata = { title: "Terms & Conditions | QubixPrep" }

export default function TermsPage() {
  return (
    <LegalPage title="Terms & Conditions">
      <TermsContent />
    </LegalPage>
  )
}
