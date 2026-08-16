"use client"

import { Menu } from "lucide-react"
import { useSidebar } from "@/components/ui/sidebar"

export function SidebarPillTrigger() {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      onClick={toggleSidebar}
      aria-label="Toggle menu"
      className="fixed top-4 left-4 z-50 flex items-center gap-1.5 rounded-full border border-white/10 bg-card/90 backdrop-blur-xl px-3 py-1.5 text-xs font-medium text-foreground shadow-lg hover:bg-card transition-colors"
    >
      <Menu className="h-3.5 w-3.5" />
      Menu
    </button>
  )
}
