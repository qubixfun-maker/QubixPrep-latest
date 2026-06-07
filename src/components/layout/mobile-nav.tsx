"use client"

import { LayoutDashboard, BookOpen, BrainCircuit, Search, FileText } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  { icon: LayoutDashboard, label: "Home", href: "/" },
  { icon: BookOpen, label: "Subjects", href: "/subjects" },
  { icon: Search, label: "Search", href: "/search" },
  { icon: BrainCircuit, label: "AI", href: "/ai-tools" },
  { icon: FileText, label: "Notes", href: "/notes" },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-4 pb-6 pointer-events-none">
      <nav className="glass rounded-2xl flex items-center justify-around p-2 pointer-events-auto max-w-lg mx-auto shadow-2xl border-white/10">
        {navItems.map((item) => {
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
      </nav>
    </div>
  )
}