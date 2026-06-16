"use client"

import { usePathname } from "next/navigation"
import { SidebarProvider } from '@/components/ui/sidebar'
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"

const AppSidebar = dynamic(() => import('@/components/layout/app-sidebar').then(mod => mod.AppSidebar), { ssr: false })
const MobileNav = dynamic(() => import('@/components/layout/mobile-nav').then(mod => mod.MobileNav), { ssr: false })

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Check if we are on an authentication page
  const isAuthPage = pathname === '/login' || pathname === '/signup'

  if (isAuthPage) {
    return (
      <main className="min-h-screen w-full bg-background">
        {children}
      </main>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className={cn(
          "flex-1 w-full",
          "pb-20 md:pb-0" // Space for mobile navigation
        )}>
          {children}
        </main>
      </div>
      <MobileNav />
    </SidebarProvider>
  )
}
