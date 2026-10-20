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
        className="mx-2 px-3 h-10 rounded-xl font-semibold text-sidebar-foreground transition-all hover:bg-secondary hover:text-primary data-[active=true]:bg-secondary data-[active=true]:text-primary"
      >
        <Link href="/case-presentation" onClick={onNavigate}>
          <ClipboardList className="h-5 w-5" />
          <span className="font-medium">Case Presentation</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
