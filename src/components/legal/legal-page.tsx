import Link from "next/link"
import type { ReactNode } from "react"
import { BrandMark } from "@/components/brand-mark"

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/signup" className="mb-4 inline-flex items-center gap-2 text-sm text-primary hover:underline">
          <BrandMark className="h-6 w-auto" /> Back to QubixPrep
        </Link>
        <h1 className="text-3xl font-bold">{title}</h1>
        <div className="mt-4 rounded-xl border bg-card p-5 shadow-sm sm:p-8">{children}</div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link href="/terms" className="hover:underline">Terms &amp; Conditions</Link> · <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}
