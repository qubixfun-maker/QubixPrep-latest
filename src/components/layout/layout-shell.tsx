"use client"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, Search } from "lucide-react"
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar"
import { useTrackPageView } from "@/hooks/use-track-page-view"
import { useUser } from "@/firebase"
import { usePlan } from "@/hooks/use-plan"
import { TopSearchProvider, useTopSearchState } from "@/components/layout/top-search"
import dynamic from "next/dynamic"
const AppSidebar = dynamic(() => import("@/components/layout/app-sidebar").then(mod => mod.AppSidebar), { ssr: false })

const TABS = [
  { label: "Home", url: "/", icon: "🏠" },
  { label: "Notes", url: "/notes", icon: "📚" },
  { label: "QBank", url: "/qbank", icon: "🎯" },
  { label: "Jelly", url: "/jelly", icon: "👻" },
  { label: "Profile", url: "/profile", icon: "👤" },
]

function TopBar() {
  const { toggleSidebar } = useSidebar()
  const { user } = useUser()
  const { isPro, isBasic } = usePlan()
  const router = useRouter()
  const [q, setQ] = useState("")
  const ts = useTopSearchState()
  const scoped = ts?.placeholder ?? null
  const planLabel = isPro ? "Clinician" : isBasic ? "Scholar" : "Explorer"
  const initial = (user?.displayName || user?.email || "D").trim().charAt(0).toUpperCase()

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur-md md:px-8">
      <button
        onClick={toggleSidebar}
        aria-label="Toggle menu"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-card text-foreground transition-colors hover:bg-accent"
      >
        <Menu className="h-5 w-5" />
      </button>
      {scoped && <form
        onSubmit={(e) => { e.preventDefault(); if (!scoped && q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`) }}
        className="flex max-w-md flex-1 items-center gap-2 rounded-[14px] border border-border bg-card px-3.5 py-2.5 text-muted-foreground"
      >
        <Search className="h-4 w-4 shrink-0" />
        <input
          value={scoped ? ts!.query : q}
          onChange={(e) => (scoped ? ts!.setQuery(e.target.value) : setQ(e.target.value))}
          placeholder={scoped || "Search all of QubixPrep…"}
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
        />
      </form>}
      <div className="ml-auto flex items-center gap-2.5">
        <Link href="/pricing" className="hidden rounded-full border border-border bg-card px-3.5 py-2 text-[13px] font-bold text-muted-foreground sm:block">
          🎓 {planLabel}
        </Link>
        <Link href="/profile" aria-label="Profile" className="grid h-[38px] w-[38px] place-items-center rounded-full bg-[#d9f0d9] font-black text-[#316b48]">
          {initial}
        </Link>
      </div>
    </header>
  )
}

/** On tablets and small laptops the menu starts closed so the page gets the full width. The menu button opens it any time. */
function AutoCollapse() {
  const { setOpen, isMobile } = useSidebar()
  const done = useRef(false)
  useEffect(() => {
    if (done.current) return
    done.current = true
    if (!isMobile && window.innerWidth < 1100) setOpen(false)
  }, [isMobile, setOpen])
  return null
}

function MobileNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-border bg-sidebar/95 px-1 pt-2 backdrop-blur-md md:hidden" style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}>
      {TABS.map((t) => {
        const on = t.url === "/" ? pathname === "/" : pathname.startsWith(t.url)
        return (
          <Link key={t.label} href={t.url} className={`grid justify-items-center gap-0.5 px-2 text-[10px] font-extrabold ${on ? "text-primary" : "text-muted-foreground"}`}>
            <span className="text-xl leading-none">{t.icon}</span>
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  useTrackPageView()
  const isAuthPage = pathname === "/login" || pathname === "/signup"
  if (isAuthPage) {
    return (
      <main className="min-h-screen w-full bg-background">
        {children}
      </main>
    )
  }
  return (
    <TopSearchProvider>
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex min-w-0 w-full flex-1 flex-col">
          <TopBar />
          <main className="w-full flex-1 pb-20 md:pb-0">
            {children}
          </main>
        </div>
      </div>
      <AutoCollapse />
      <MobileNav />
    </SidebarProvider>
    </TopSearchProvider>
  )
}
