"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Loader2, ShieldCheck, X } from "lucide-react"
import { TermsContent } from "@/components/legal/terms-content"
import { PrivacyContent } from "@/components/legal/privacy-content"
import { PIRACY_DAMAGES_TEXT } from "@/lib/legal"

type Props = {
  open: boolean
  busy: boolean
  /** The student's mobile number is valid, so the WhatsApp option can be offered. */
  canWhatsApp: boolean
  onCancel: () => void
  onConfirm: (whatsapp: boolean) => void
}

/** The "before you join" popup: key points, required agreement, separate optional WhatsApp consent. */
export function ConsentDialog({ open, busy, canWhatsApp, onCancel, onConfirm }: Props) {
  const [agree, setAgree] = useState(false)
  const [wa, setWa] = useState(false)
  const [view, setView] = useState<"summary" | "terms" | "privacy">("summary")

  useEffect(() => {
    if (open) { setAgree(false); setWa(false); setView("summary") }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Terms and consent">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-2xl bg-card shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2 font-bold">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {view === "summary" ? "Before you join QubixPrep" : view === "terms" ? "Terms & Conditions" : "Privacy Policy"}
          </div>
          <button type="button" onClick={onCancel} className="rounded p-1 text-muted-foreground hover:bg-accent" aria-label="Close" disabled={busy}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 text-sm">
          {view === "summary" && (
            <div className="space-y-4">
              <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                <li>QubixPrep content is for <strong className="text-foreground">your personal study only</strong>. Don&apos;t share your account or log-in.</li>
                <li>
                  <strong className="text-red-500">Piracy is not tolerated.</strong> Copying, leaking or sharing our notes, questions or any content (WhatsApp, Telegram, Drive, social media, resale) leads to a permanent ban and <strong className="text-foreground">strict legal action</strong> — civil and criminal — including a claim of up to <strong className="text-foreground">{PIRACY_DAMAGES_TEXT}</strong>.
                </li>
                <li>Your data is used <strong className="text-foreground">only by QubixPrep, for your benefit</strong>. We never sell it. Trusted providers (Google, Razorpay, AI services) process it only to run the app.</li>
                <li>AI answers are study aids, not medical advice.</li>
              </ul>
              <div className="flex gap-4 text-xs">
                <button type="button" className="text-primary underline" onClick={() => setView("terms")}>Read full Terms &amp; Conditions</button>
                <button type="button" className="text-primary underline" onClick={() => setView("privacy")}>Read Privacy Policy</button>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3">
                <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-[hsl(var(--primary))]" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                <span>
                  I have read and agree to the <Link href="/terms" target="_blank" className="text-primary underline">Terms &amp; Conditions</Link> (including the anti-piracy clause) and the <Link href="/privacy" target="_blank" className="text-primary underline">Privacy Policy</Link>. <span className="text-red-500">*</span>
                </span>
              </label>

              <label className={`flex items-start gap-3 rounded-lg border p-3 ${canWhatsApp ? "cursor-pointer" : "opacity-50"}`}>
                <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-[hsl(var(--primary))]" disabled={!canWhatsApp} checked={wa && canWhatsApp} onChange={(e) => setWa(e.target.checked)} />
                <span>
                  <span className="font-medium">(Optional)</span> Send me study updates, reminders and offers on WhatsApp on the mobile number I entered. I can stop any time by replying STOP or writing to support. This is not needed to use QubixPrep.
                  {!canWhatsApp && <span className="block text-xs text-red-500">Enter a valid 10-digit mobile number to enable this.</span>}
                </span>
              </label>
            </div>
          )}
          {view === "terms" && <TermsContent />}
          {view === "privacy" && <PrivacyContent />}
        </div>

        <div className="flex gap-2 border-t px-5 py-4">
          {view !== "summary" ? (
            <Button type="button" variant="outline" className="w-full" onClick={() => setView("summary")}>Back</Button>
          ) : (
            <>
              <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={busy}>Cancel</Button>
              <Button type="button" className="flex-1" disabled={!agree || busy} onClick={() => onConfirm(wa && canWhatsApp)}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "I Agree & Create Account"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
