
"use client"

import { useMemo } from "react"
import { 
  BookOpen, 
  LayoutDashboard, 
  BrainCircuit, 
  Search, 
  Settings, 
  ShieldCheck, 
  FileText, 
  Video, 
  History,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser, useDoc, useFirestore } from "@/firebase"
import { doc } from "firebase/firestore"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const items = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Subjects",
    url: "/notes",
    icon: BookOpen,
  },
  {
    title: "Video Lectures",
    url: "/videos",
    icon: Video,
  },
  {
    title: "AI Tools",
    url: "/ai-tools",
    icon: BrainCircuit,
  },
  {
    title: "Notes & Books",
    url: "/notes",
    icon: FileText,
  },
  {
    title: "Study History",
    url: "/history",
    icon: History,
  },
]

const adminItems = [
  {
    title: "Admin Panel",
    url: "/admin",
    icon: ShieldCheck,
  },
  {
    title: "Global Search",
    url: "/search",
    icon: Search,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()

  const profileRef = useMemo(() => {
    if (!db || !user) return null
    return doc(db, 'users', user.uid)
  }, [db, user])

  const { data: profile, loading: profileLoading } = useDoc(profileRef)
  const isAdmin = profile && (profile as any).role === 'admin'

  return (
    <Sidebar collapsible="icon" className="border-r border-white/5 bg-card/50 backdrop-blur-xl">
      <SidebarHeader className="p-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
            <span className="text-xl font-bold text-white">Q</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white group-data-[collapsible=icon]:hidden">
            Qubix<span className="text-accent">Prep</span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-6 text-xs uppercase tracking-widest text-muted-foreground/50">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                    className="mx-2 px-4 h-12 rounded-xl transition-all hover:bg-white/5 hover:text-accent data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                  >
                    <Link href={item.url}>
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* Only show admin section if user is an admin or we are loading */}
        {(isAdmin || profileLoading) && (
          <SidebarGroup className="mt-auto">
            <SidebarGroupLabel className="px-6 text-xs uppercase tracking-widest text-muted-foreground/50">Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url}
                      tooltip={item.title}
                      className="mx-2 px-4 h-12 rounded-xl transition-all hover:bg-white/5 hover:text-accent data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                    >
                      <Link href={item.url}>
                        {profileLoading && item.title === 'Admin Panel' ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <item.icon className="h-5 w-5" />
                        )}
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
