"use client"

import Link from "next/link"
import { LayoutGrid } from "lucide-react"
import { SidebarMenuItem, SidebarMenuButton, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton } from "@/components/ui/sidebar"
import { useFeatureSettings } from "@/hooks/use-quickcards"
import { SORTED_FEATURES } from "@/lib/quickcards/cardFeatures"
import { getFeatureIcon } from "./icons"

/** QuickCards hub entry plus one sub-entry per visible feature, for the floating Menu. */
export function QuickCardsMenuItems({ pathname, onNavigate }: { pathname: string; onNavigate: () => void }) {
  const { settings } = useFeatureSettings()
  const visible = SORTED_FEATURES.filter((f) => settings[f.slug]?.visible !== false)
  if (visible.length === 0) return null

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={pathname === "/quickcards"}
        tooltip="QuickCards"
        className="mx-2 px-3 h-10 rounded-xl font-semibold text-sidebar-foreground transition-all hover:bg-secondary hover:text-primary data-[active=true]:bg-secondary data-[active=true]:text-primary"
      >
        <Link href="/quickcards" onClick={onNavigate}>
          <LayoutGrid className="h-5 w-5" />
          <span className="font-medium">QuickCards</span>
        </Link>
      </SidebarMenuButton>
      <SidebarMenuSub className="mx-4">
        {visible.map((f) => {
          const Icon = getFeatureIcon(f.icon)
          return (
            <SidebarMenuSubItem key={f.slug}>
              <SidebarMenuSubButton asChild isActive={pathname === `/quickcards/${f.slug}`}>
                <Link href={`/quickcards/${f.slug}`} onClick={onNavigate}>
                  <Icon className="h-4 w-4" />
                  <span>{f.name}</span>
                </Link>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          )
        })}
      </SidebarMenuSub>
    </SidebarMenuItem>
  )
}
