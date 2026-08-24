"use client"
import { usePathname } from "next/navigation"
import { SidebarProvider } from "@/components/ui/sidebar"
import { SidebarPillTrigger } from "@/components/layout/sidebar-pill-trigger"
import { useTrackPageView } from "@/hooks/use-track-page-view"
import dynamic from "next/dynamic"
const AppSidebar = dynamic(() => import("@/components/layout/app-sidebar").then(mod => mod.AppSidebar), { ssr: false })
export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  useTrackPageView()
  const isAuthPage = pathname === "/login" || pathname === "/signup"
  if (isAuthPage) {
    return (
      <main className="min-h-screen w-full bg-background">
        {children}
      </main>
    )
  }
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex-1 w-full flex flex-col min-w-0">
          <SidebarPillTrigger />
          <main className="flex-1 w-full">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
