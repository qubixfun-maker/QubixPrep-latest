// One place for the legal details. Change a value here and every page / popup updates.

/** Bump this date whenever the Terms or Privacy Policy change in a way users must re-accept. */
export const TERMS_VERSION = "2026-10-25"
export const PRIVACY_VERSION = "2026-10-25"

export const COMPANY_NAME = "QubixPrep"
export const SITE_URL = "https://qubixprep.com"

/** Shown as the contact + grievance address in the Terms and Privacy Policy. CHANGE THIS to your real support email. */
export const CONTACT_EMAIL = "support@qubixprep.com"

/** Legal city whose courts decide disputes (example: "Hyderabad"). Leave "" to say "competent courts in India". */
export const JURISDICTION_CITY = ""

/** Your WhatsApp group INVITE link (https://chat.whatsapp.com/...). Leave "" to hide the Join button. */
export const WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/GSZv0O2kTZj5Z0ywf1P7ua"

/** Maximum compensation the Company may claim for piracy / unauthorised sharing (rupees). */
export const PIRACY_DAMAGES_INR = 50000000
export const PIRACY_DAMAGES_TEXT = "₹5,00,00,000 (Rupees Five Crore)"

/** Normalises an Indian mobile number to 10 digits. Returns "" if it does not look valid. */
export function normalizeMobile(raw: string): string {
  let d = (raw || "").replace(/\D/g, "")
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2)
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1)
  return /^[6-9]\d{9}$/.test(d) ? d : ""
}

export type ConsentRecord = {
  termsVersion: string
  termsAcceptedAt: string
  privacyVersion: string
  privacyAcceptedAt: string
  whatsappConsent: boolean
  whatsappConsentAt: string | null
  whatsappNumber: string | null
  consentSource: "email" | "google"
}

export function buildConsent(opts: { whatsapp: boolean; mobile: string; source: "email" | "google" }): ConsentRecord {
  const now = new Date().toISOString()
  const num = normalizeMobile(opts.mobile)
  const wa = opts.whatsapp && !!num
  return {
    termsVersion: TERMS_VERSION,
    termsAcceptedAt: now,
    privacyVersion: PRIVACY_VERSION,
    privacyAcceptedAt: now,
    whatsappConsent: wa,
    whatsappConsentAt: wa ? now : null,
    whatsappNumber: wa ? `91${num}` : null,
    consentSource: opts.source,
  }
}
