"use client"

import Link from "next/link"
import { ClipboardList } from "lucide-react"
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar"

export function CasePresentationMenuItem({ pathname, onNavigate }: { pathname: string; onNavigate: () => void }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={pathname.startsWith("/case-presentation")}
        tooltip="Case Presentation"
        className="mx-2 px-4 h-12 rounded-xl transition-all hover:bg-white/5 hover:text-accent data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
      >
        <Link href="/case-presentation" onClick={onNavigate}>
          <ClipboardList className="h-5 w-5" />
          <span className="font-medium">Case Presentation</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
