"use client"

import { usePathname } from "next/navigation"
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { cn } from "@/lib/utils"

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
