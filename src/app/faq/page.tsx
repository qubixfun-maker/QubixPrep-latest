"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search, ChevronDown, MessageCircle, Mail, LifeBuoy, CreditCard, BookOpen, Layers, Stethoscope, UserCircle, Wrench } from "lucide-react"
import { SUPPORT_EMAIL, SUPPORT_WHATSAPP_DISPLAY, whatsappLink } from "@/lib/contact"

type QA = { q: string; a: string }
type Cat = { id: string; title: string; icon: any; items: QA[] }

const CATS: Cat[] = [
  {
    id: "plans", title: "Plans & payments", icon: CreditCard,
    items: [
      { q: "What do I get for free?", a: "The free Explorer plan gives you 5 free notes per subject, all video lectures, 3 free mind maps per subject, 10 QBank questions per subject and a basic dashboard. Top 100 Topics is free for everyone." },
      { q: "What does the Scholar plan include?", a: "Scholar is ₹999 per year. It unlocks the full notes library, all mind maps, the full QBank for every subject, Custom Test Series, all video lectures and every QuickCards section. The AI Tools (AI Tutor, Summarizer, Quiz Generator, PDF AI Extraction) are not part of this plan." },
      { q: "How do I pay?", a: "Go to Pricing and tap Subscribe. Payment runs through Razorpay, and the payment options available to you are shown at checkout." },
      { q: "Does the plan renew automatically? Can I cancel?", a: "The plan renews yearly through Razorpay. You can cancel any time from your Profile page." },
      { q: "I paid but my plan is not active.", a: "First refresh the app and sign out and in once. If the plan still shows Explorer, message us on WhatsApp or email with the email you signed up with and a screenshot of the payment. We will sort it out." },
      { q: "Can I get a refund?", a: "Write to us with your payment details and the reason, and we will look into your case." },
    ],
  },
  {
    id: "learning", title: "Notes, QBank & flashcards", icon: BookOpen,
    items: [
      { q: "How is the QBank organised?", a: "Pick a subject, then a topic, and answer one question at a time with instant feedback and an explanation. Your accuracy per topic is recorded so you can see your weak areas." },
      { q: "How do flashcards work now?", a: "Open a subject, pick a chapter and the study mode opens full screen. Tap the card to flip it, then press Got it or Review again. Your answers are saved to your account, so cards you miss come back for review." },
      { q: "How do I use the mind maps?", a: "Drag to move, pinch or scroll to zoom, and tap a dot to open or close its sub-topics. The green button shows or hides the short notes, the arrows expand or collapse everything, and the frame button fits the whole map to your screen." },
      { q: "What are QuickCards?", a: "QuickCards are dense, one-page reference cards: lab records decoded, OPD clinical references, important drugs, emergency and procedure playbooks and more. They are included in the Scholar plan." },
      { q: "A question or answer looks wrong. What should I do?", a: "Please tell us. Use the Report option on the question if you see it, or message Support with the subject, topic and the question text. Corrections are reviewed and fixed." },
    ],
  },
  {
    id: "practice", title: "Ward Round, Arena & Jelly", icon: Stethoscope,
    items: [
      { q: "What is Ward Round?", a: "Ward Round turns clinical cases into a game. You take the history, examine, investigate, diagnose and treat while the patient's condition changes with each decision. Expert cases add procedures to put in order, scans, lab reports, timed decisions and mid-case complications." },
      { q: "What is Arena?", a: "Arena is the multiplayer mode: QBank duels, flashcard battles and co-op ward rounds with friends, plus challenge links, seasons and a leaderboard." },
      { q: "What is Jelly?", a: "Jelly is your AI study companion. It reacts as you answer questions and can explain things on request. Which Jelly features you can use depends on your plan, which you can see on the Pricing page." },
      { q: "Do I lose my progress if I switch device?", a: "Sign in with the same account and your flashcard reviews, QBank accuracy, Ward Round progress and mind map bookmarks follow you." },
    ],
  },
  {
    id: "account", title: "Account", icon: UserCircle,
    items: [
      { q: "How do I change my profile or year?", a: "Open Profile from the menu. You can update your details there." },
      { q: "I cannot sign in.", a: "Check that you are using the same email or Google account you signed up with. If it still fails, message us the email you used and what you see on screen." },
      { q: "Can I use QubixPrep on my phone?", a: "Yes. It works in any browser, and you can add it to your home screen from your browser menu (Add to Home Screen or Install App) so it opens like an app." },
    ],
  },
  {
    id: "tech", title: "Something is not working", icon: Wrench,
    items: [
      { q: "A page is blank or loading forever.", a: "Refresh the page and check your internet. If you recently updated the app, close the tab and open it again. If it keeps happening, send us a screenshot, the page address and your device and browser through Support." },
      { q: "Is QubixPrep a substitute for clinical guidance?", a: "No. QubixPrep is for exam preparation and learning. Do not use it to make decisions about real patients; follow your hospital protocols and your teachers." },
    ],
  },
]

export default function FaqPage() {
  const [q, setQ] = useState("")
  const [cat, setCat] = useState("all")

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return CATS.filter((c) => cat === "all" || c.id === cat)
      .map((c) => ({ ...c, items: c.items.filter((i) => !needle || (i.q + " " + i.a).toLowerCase().includes(needle)) }))
      .filter((c) => c.items.length)
  }, [q, cat])

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: CATS.flatMap((c) => c.items).map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
  }

  return (
    <div className="mx-auto max-w-4xl space-y-7 p-4 md:p-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="relative overflow-hidden rounded-[2rem] p-7 text-white shadow-xl md:p-10" style={{ background: "linear-gradient(120deg,#5b3fd1 0%,#8b5cf6 55%,#c04cdb 100%)" }}>
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
        <div className="relative space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em]"><LifeBuoy className="h-3 w-3" /> Help centre</span>
          <h1 className="text-3xl font-black tracking-tight md:text-5xl">Frequently asked questions</h1>
          <p className="max-w-lg text-sm font-medium text-white/85 md:text-base">Quick answers about plans, flashcards, QBank, Ward Round and your account. Cannot find yours? Message us any time.</p>
          <div className="relative pt-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 mt-1 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search questions…" className="h-12 w-full rounded-2xl border-0 bg-white pl-11 pr-4 text-sm font-medium text-slate-900 shadow-lg outline-none placeholder:text-slate-400 focus:ring-4 focus:ring-white/40" />
          </div>
        </div>
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {[{ id: "all", title: "All" }, ...CATS].map((c) => (
          <button key={c.id} onClick={() => setCat(c.id)} className={`shrink-0 rounded-full border px-4 py-2 text-xs font-extrabold transition ${cat === c.id ? "border-primary bg-primary text-white shadow-md" : "border-border bg-card text-muted-foreground hover:border-primary/50"}`}>{c.title}</button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-lg font-extrabold">No answer found for “{q}”</p>
          <p className="mt-1 text-sm text-muted-foreground">Ask us directly and we will help.</p>
          <Link href="/support" className="mt-4 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-extrabold text-white">Contact support</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {shown.map((c) => (
            <section key={c.id} className="space-y-3">
              <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-muted-foreground"><c.icon className="h-4 w-4 text-primary" /> {c.title}</h2>
              <div className="space-y-2.5">
                {c.items.map((i) => (
                  <details key={i.q} className="group rounded-2xl border border-border bg-card shadow-sm transition open:border-primary/40 open:shadow-md">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 text-[15px] font-bold [&::-webkit-details-marker]:hidden">
                      <span>{i.q}</span>
                      <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 group-open:text-primary" />
                    </summary>
                    <p className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground">{i.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="grid gap-3 rounded-3xl border border-border bg-card p-5 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <p className="text-base font-extrabold">Still stuck?</p>
          <p className="text-sm text-muted-foreground">Message us on WhatsApp ({SUPPORT_WHATSAPP_DISPLAY}) or email {SUPPORT_EMAIL}.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={whatsappLink("Hi QubixPrep, I need help with: ")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-extrabold text-white shadow"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
          <Link href="/support" className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-extrabold text-white shadow"><Mail className="h-4 w-4" /> Support page</Link>
        </div>
      </div>
    </div>
  )
}
