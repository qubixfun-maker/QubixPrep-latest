"use client"
import { usePathname } from "next/navigation"
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"

const AppSidebar = dynamic(() => import('@/components/layout/app-sidebar').then(mod => mod.AppSidebar), { ssr: false })

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

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
        <div className="flex-1 w-full flex flex-col min-w-0">
          <header className="md:hidden sticky top-0 z-40 flex items-center gap-3 px-4 h-14 border-b border-white/5 bg-background/80 backdrop-blur-xl">
            <SidebarTrigger />
            <span className="text-lg font-bold tracking-tight">
              Qubix<span className="text-accent">Prep</span>
            </span>
          </header>
          <main className="flex-1 w-full">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
