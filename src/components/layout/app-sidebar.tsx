"use client"

import { useMemo } from "react"
import {
  BookOpen, GraduationCap, Layers, Network, Flame, Database, Trophy, BrainCircuit, Stethoscope,
  Sparkles, Wand2, ShoppingBag, Gift, User, Zap, CloudUpload, Lock, Plus, Star, Newspaper, Swords, HelpCircle, LifeBuoy, RotateCcw, BarChart3, CalendarDays, Timer, Microscope,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser, useDoc, useFirestore } from "@/firebase"
import { doc } from "firebase/firestore"
import { usePlan } from "@/hooks/use-plan"
import { QuickCardsMenuItems } from "@/components/quickcards/menu-items"
import { CasePresentationMenuItem } from "@/components/casepres/menu-item"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

const ITEM =
  "mx-2 px-3 h-10 rounded-xl font-semibold text-sidebar-foreground transition-all hover:bg-secondary hover:text-primary data-[active=true]:bg-secondary data-[active=true]:text-primary"

type Item = { title: string; url: string; icon: any; lock?: boolean }

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useUser()
  const db = useFirestore()
  const { isMobile, setOpenMobile } = useSidebar()
  const { isFree, isBasic, isPro, canAccessContent, canAccessAI } = usePlan()

  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false)
  }

  const profileRef = useMemo(() => {
    if (!db || !user) return null
    return doc(db, "users", user.uid)
  }, [db, user])
  const { data: profile } = useDoc(profileRef)
  const isAdmin = profile && (profile as any).role === "admin"
  const year = (profile as any)?.currentYear
  const planLabel = isPro ? "Clinician" : isBasic ? "Scholar" : "Explorer"
  const name = user?.displayName?.split(" ")[0] || "Future doctor"

  const learn: Item[] = [
    { title: "Dashboard", url: "/", icon: Zap },
    { title: "Notes", url: "/notes", icon: BookOpen },
    { title: "Top 100 Topics", url: "/top-100", icon: Star },
    { title: "Long Answers", url: "/long-answers", icon: GraduationCap },
    { title: "Flashcards", url: "/flashcards", icon: Layers },
    { title: "Mind Maps", url: "/mindmaps", icon: Network },
    { title: "Med Stories", url: "/stories", icon: Newspaper },
  ]
  const practise: Item[] = [
    { title: "Daily Review", url: "/review", icon: RotateCcw },
    { title: "My Progress", url: "/my-progress", icon: BarChart3 },
    { title: "Study Plan", url: "/plan", icon: CalendarDays },
    { title: "QBank", url: "/qbank", icon: Database },
    { title: "PYQ Series", url: "/pyq", icon: Trophy },
    { title: "Custom Quiz", url: "/test-series", icon: BrainCircuit, lock: !canAccessContent },
    { title: "Grand Test", url: "/grand-test", icon: Timer },
    { title: "Ward Round", url: "/cases", icon: Stethoscope },
    { title: "Arena", url: "/arena", icon: Swords },
    { title: "OSCE Stations", url: "/osce-stations", icon: Stethoscope },
    { title: "Case Presentation", url: "/case-presentation", icon: Stethoscope },
    { title: "Spot & Identify", url: "/spotters", icon: Microscope },
  ]
  const studio: Item[] = [
    { title: "Jelly AI", url: "/jelly", icon: Sparkles },
    { title: "AI Tools", url: "/ai-tools", icon: Wand2, lock: !canAccessAI },
  ]
  const account: Item[] = [
    { title: "Store", url: "/products", icon: ShoppingBag },
    { title: "Affiliate", url: "/affiliate", icon: Gift },
    { title: "Profile", url: "/profile", icon: User },
    { title: "Pricing", url: "/pricing", icon: Zap },
    { title: "Help & FAQ", url: "/faq", icon: HelpCircle },
    { title: "Support", url: "/support", icon: LifeBuoy },
  ]

  const active = (url: string) => (url === "/" ? pathname === "/" : pathname.startsWith(url))

  const row = (item: Item) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild isActive={active(item.url)} tooltip={item.title} className={ITEM}>
        <Link href={item.url} onClick={closeOnMobile}>
          <item.icon className="h-[18px] w-[18px]" />
          <span>{item.title}</span>
          {item.lock && <Lock className="ml-auto h-3 w-3 text-muted-foreground/60" />}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )

  const label = (t: string) => (
    <SidebarGroupLabel className="px-5 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70">{t}</SidebarGroupLabel>
  )

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-border bg-sidebar">
      <SidebarHeader className="gap-4 p-4 pb-2">
        <Link href="/" className="flex items-center gap-2.5 px-2 min-w-0" onClick={closeOnMobile}>
          <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[13px] bg-primary text-white shadow-lg shadow-primary/25 shrink-0">
            <Plus className="h-5 w-5" strokeWidth={3} />
          </div>
          <span className="text-[22px] font-black tracking-tight text-primary truncate">QubixPrep</span>
        </Link>
        {user && (
          <Link href="/profile" onClick={closeOnMobile} className="flex items-center gap-2.5 rounded-2xl bg-secondary p-3 min-w-0">
            <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#ffe0cb] text-lg shrink-0">🩺</div>
            <div className="min-w-0">
              <strong className="block truncate text-[13px]">Hey, {name}!</strong>
              <small className="block truncate text-muted-foreground">{planLabel}{year ? ` • ${year}` : ""}</small>
            </div>
          </Link>
        )}
      </SidebarHeader>

      <SidebarContent className="gap-0">
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === "/admin"} tooltip="Admin" className={ITEM + " border border-primary/20 bg-primary/5"}>
                    <Link href="/admin" onClick={closeOnMobile}>
                      <CloudUpload className="h-[18px] w-[18px]" />
                      <span>Content Manager</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith("/prof-pyq")} tooltip="Prof PYQ (hidden from users)" className={ITEM + " border border-dashed border-yellow-500/30"}>
                    <Link href="/prof-pyq" onClick={closeOnMobile}>
                      <GraduationCap className="h-[18px] w-[18px]" />
                      <span>Prof PYQ (admin only)</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          {label("Learn")}
          <SidebarGroupContent>
            <SidebarMenu>
              {learn.slice(0, 5).map(row)}
              <QuickCardsMenuItems pathname={pathname} onNavigate={closeOnMobile} />
              {learn.slice(5).map(row)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {label("Practise")}
          <SidebarGroupContent>
            <SidebarMenu>
              {practise.slice(0, 8).map(row)}
              <CasePresentationMenuItem pathname={pathname} onNavigate={closeOnMobile} />
              {practise.slice(8).map(row)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {label("AI Studio")}
          <SidebarGroupContent>
            <SidebarMenu>{studio.map(row)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {label("Account")}
          <SidebarGroupContent>
            <SidebarMenu>{account.map(row)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {isFree && (
        <SidebarFooter className="p-4">
          <div className="rounded-[18px] bg-[#fff0df] p-4">
            <div className="text-[28px] leading-none">🌟</div>
            <b className="mt-1 block text-sm text-[#382316]">Make your next leap</b>
            <p className="my-1 mb-3 text-xs text-[#80674f]">Unlock every note, quiz, case and Jelly session.</p>
            <Link href="/pricing" onClick={closeOnMobile} className="block w-full rounded-xl bg-[#292333] px-3 py-2.5 text-center text-[13px] font-extrabold text-white">
              Explore Scholar · ₹999/yr
            </Link>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  )
}
