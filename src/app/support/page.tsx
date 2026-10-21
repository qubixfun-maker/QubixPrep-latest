"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { MessageCircle, Mail, Copy, Check, Send, Loader2, HelpCircle, CreditCard, Bug, Lightbulb, Clock } from "lucide-react"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { useFirestore, useUser } from "@/firebase"
import { usePlan } from "@/hooks/use-plan"
import { SUPPORT_EMAIL, SUPPORT_WHATSAPP_DISPLAY, whatsappLink, mailtoLink } from "@/lib/contact"

const TOPICS = [
  { id: "payment", label: "Payment or plan", icon: CreditCard },
  { id: "bug", label: "Something is broken", icon: Bug },
  { id: "content", label: "Content error", icon: HelpCircle },
  { id: "doubt", label: "A study doubt", icon: Lightbulb },
  { id: "other", label: "Something else", icon: MessageCircle },
]

export default function SupportPage() {
  const db = useFirestore()
  const { user } = useUser()
  const { isPro, isBasic } = usePlan()
  const planLabel = isPro ? "Clinician" : isBasic ? "Scholar" : "Explorer"
  const [topic, setTopic] = useState("payment")
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState("")

  const topicLabel = TOPICS.find((t) => t.id === topic)?.label || "Help"
  const who = useMemo(() => (user ? `${user.displayName || "Student"} (${user.email || "no email"}, plan: ${planLabel})` : "a visitor"), [user, planLabel])
  const waText = `Hi QubixPrep, I am ${who}. Topic: ${topicLabel}. ${message.trim() || "I need help with: "}`
  const mailBody = `${message.trim() || "Describe your problem here."}\n\n---\nAccount: ${who}`

  async function copy(text: string, key: string) {
    try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(""), 1500) } catch {}
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!db || !user) return
    if (message.trim().length < 10) { setError("Please write a few more words so we can help."); return }
    setBusy(true); setError("")
    try {
      await addDoc(collection(db, "supportRequests"), {
        uid: user.uid, email: user.email || "", name: user.displayName || "", plan: planLabel,
        topic, message: message.trim().slice(0, 3000), status: "open", createdAt: serverTimestamp(),
      })
      setSent(true); setMessage("")
    } catch {
      setError("Could not send. Please use WhatsApp or email below.")
    } finally { setBusy(false) }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-7 p-4 md:p-10">
      <div className="keep-dark relative overflow-hidden rounded-[2rem] p-7 text-white shadow-xl md:p-10" style={{ background: "linear-gradient(120deg,#0f766e 0%,#14b8a6 50%,#38bdf8 100%)" }}>
        <div aria-hidden className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
        <div className="relative space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em]"><MessageCircle className="h-3 w-3" /> Support</span>
          <h1 className="text-3xl font-black tracking-tight md:text-5xl">We are here to help</h1>
          <p className="max-w-lg text-sm font-medium text-white/90 md:text-base">Payment trouble, a wrong answer, a bug or a study doubt. Pick the quickest way to reach us.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#25D366] text-white"><MessageCircle className="h-6 w-6" /></span><div><p className="font-extrabold">WhatsApp</p><p className="text-sm text-muted-foreground">Fastest for payment and plan issues</p></div></div>
          <p className="font-mono text-lg font-black tracking-wide">{SUPPORT_WHATSAPP_DISPLAY}</p>
          <div className="flex flex-wrap gap-2">
            <a href={whatsappLink(waText)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-extrabold text-white shadow"><MessageCircle className="h-4 w-4" /> Chat on WhatsApp</a>
            <button onClick={() => copy(SUPPORT_WHATSAPP_DISPLAY.replace(/\s/g, ""), "wa")} className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-sm font-bold">{copied === "wa" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />} {copied === "wa" ? "Copied" : "Copy number"}</button>
          </div>
        </div>

        <div className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-white"><Mail className="h-6 w-6" /></span><div><p className="font-extrabold">Email</p><p className="text-sm text-muted-foreground">Best for screenshots and long details</p></div></div>
          <p className="break-all font-mono text-lg font-black tracking-wide">{SUPPORT_EMAIL}</p>
          <div className="flex flex-wrap gap-2">
            <a href={mailtoLink(`QubixPrep support: ${topicLabel}`, mailBody)} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-extrabold text-white shadow"><Mail className="h-4 w-4" /> Write an email</a>
            <button onClick={() => copy(SUPPORT_EMAIL, "mail")} className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-sm font-bold">{copied === "mail" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />} {copied === "mail" ? "Copied" : "Copy address"}</button>
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-sm md:p-6">
        <div>
          <p className="text-lg font-extrabold">Send us a message here</p>
          <p className="text-sm text-muted-foreground">It goes straight to our support inbox with your account details attached.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <button type="button" key={t.id} onClick={() => setTopic(t.id)} className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-extrabold transition ${topic === t.id ? "border-primary bg-primary text-white shadow" : "border-border bg-background text-muted-foreground hover:border-primary/50"}`}><t.icon className="h-3.5 w-3.5" /> {t.label}</button>
          ))}
        </div>

        {!user ? (
          <div className="rounded-2xl bg-secondary p-4 text-sm"><b>Log in to send a message here.</b> <Link href="/login" className="font-extrabold text-primary underline">Log in</Link> or use WhatsApp or email above.</div>
        ) : sent ? (
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Thanks! Your message is with us. We will reply to {user.email || "your account email"}. <button type="button" onClick={() => setSent(false)} className="ml-2 font-extrabold underline">Send another</button></div>
        ) : (
          <>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} maxLength={3000} placeholder={topic === "payment" ? "Tell us the email you paid with, the amount and the payment ID or time." : topic === "content" ? "Tell us the subject, topic and the question text, and what is wrong." : "Describe what happened and what you expected."} className="w-full resize-y rounded-2xl border border-border bg-background p-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15" />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">Sending as {user.displayName || "you"} · {user.email} · {planLabel}</p>
              <button disabled={busy} className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-extrabold text-white shadow transition disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send message</button>
            </div>
            {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}
          </>
        )}
      </form>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { t: "Read the FAQ", d: "Plans, payments, flashcards, Ward Round", href: "/faq" },
          { t: "Plans and pricing", d: "See what Scholar unlocks", href: "/pricing" },
          { t: "Cancel or manage", d: "From your Profile page", href: "/profile" },
        ].map((l) => (
          <Link key={l.t} href={l.href} className="rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"><p className="font-extrabold">{l.t}</p><p className="text-xs text-muted-foreground">{l.d}</p></Link>
        ))}
      </div>

      <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" /> Include your signup email and a screenshot when you can. It helps us fix things faster.</p>
    </div>
  )
}
