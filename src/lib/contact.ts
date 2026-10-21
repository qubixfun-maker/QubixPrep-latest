// Single place for QubixPrep support contact details.
export const SUPPORT_EMAIL = "qubixprep@gmail.com"
export const SUPPORT_WHATSAPP_INTL = "918792215969" // wa.me format: country code + number, digits only
export const SUPPORT_WHATSAPP_DISPLAY = "+91 87922 15969"

export function whatsappLink(message: string) {
  return `https://wa.me/${SUPPORT_WHATSAPP_INTL}?text=${encodeURIComponent(message)}`
}
export function mailtoLink(subject: string, body: string) {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
