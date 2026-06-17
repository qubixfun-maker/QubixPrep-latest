"use client"

import { useState } from "react"
import {
  LayoutDashboard,
  BookOpen,
  BrainCircuit,
  Search,
  Menu,
  Network,
  Database,
  Trophy,
  Video,
  ShoppingBag,
  Zap,
  User,
  X
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"

const primaryItems = [
  { icon: LayoutDashboard, label: "Home", href: "/" },
  { icon: BookOpen, label: "Notes", href: "/notes" },
  { icon: Search, label: "Search", href: "/search" },
  { icon: BrainCircuit, label: "AI", href: "/ai-tools" },
]

const moreItems = [
  { icon: Database, label: "QBank", href: "/qbank" },
  { icon: Trophy, label: "PYQ Series", href: "/pyq" },
  { icon: BrainCircuit, label: "Custom Quiz", href: "/test-series" },
  { icon: Network, label: "Mindmaps", href: "/mindmaps" },
  { icon: Video, label: "Video Lectures", href: "/videos" },
  { icon: ShoppingBag, label: "Store", href: "/products" },
  { icon: Zap, label: "Pricing", href: "/pricing" },
  { icon: User, label: "Profile", href: "/profile" },
]

export function MobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-4 pb-6 pointer-events-none">
      <nav className="glass rounded-2xl flex items-center justify-around p-2 pointer-events-auto max-w-lg mx-auto shadow-2xl border-white/10">
        {primaryItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-300",
                isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-white"
              )}
            >
              <item.icon className={cn("h-6 w-6", isActive && "scale-110")} />
              <span className="text-[10px] font-medium mt-1 uppercase tracking-tighter">{item.label}</span>
            </Link>
          )
        })}

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-300",
                "text-muted-foreground hover:text-white"
              )}
            >
              <Menu className="h-6 w-6" />
              <span className="text-[10px] font-medium mt-1 uppercase tracking-tighter">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl border-white/10 max-h-[75vh] overflow-y-auto">
            <div className="grid grid-cols-3 gap-4 pt-6 pb-4">
              {moreItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all",
                      isActive ? "bg-primary/10 text-primary" : "bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10"
                    )}
                  >
                    <item.icon className="h-6 w-6" />
                    <span className="text-xs font-medium text-center">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  )
}
