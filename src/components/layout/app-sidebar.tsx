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
  CloudUpload,
  Network,
  Database,
  Trophy,
  User,
  Zap
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

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useUser()
  const db = useFirestore()

  const profileRef = useMemo(() => {
    if (!db || !user) return null
    return doc(db, 'users', user.uid)
  }, [db, user])

  const { data: profile } = useDoc(profileRef)
  const isAdmin = profile && (profile as any).role === 'admin'

  const mainItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
    },
    {
      title: "Notes",
      url: "/notes",
      icon: BookOpen,
    },
    {
      title: "Mindmaps",
      url: "/mindmaps",
      icon: Network,
    },
    {
      title: "QBank",
      url: "/qbank",
      icon: Database,
    },
    {
      title: "Custom quiz",
      url: "/test-series",
      icon: Trophy,
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
      title: "History",
      url: "/history",
      icon: History,
    },
    {
      title: "Pricing",
      url: "/pricing",
      icon: Zap,
    }
  ]

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
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/admin"}
                    tooltip="Admin"
                    className="mx-2 px-4 h-12 rounded-xl transition-all border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
                  >
                    <Link href="/admin">
                      <CloudUpload className="h-5 w-5" />
                      <span className="font-bold">Content Manager</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.url === "/" ? pathname === "/" : pathname.startsWith(item.url)}
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

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/profile"}
                  tooltip="Profile"
                  className="mx-2 px-4 h-12 rounded-xl transition-all hover:bg-white/5 hover:text-accent data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                >
                  <Link href="/profile">
                    <User className="h-5 w-5" />
                    <span className="font-medium">Profile</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
