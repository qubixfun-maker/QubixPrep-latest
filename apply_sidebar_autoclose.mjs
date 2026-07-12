import fs from 'fs'

function replaceOnce(file, oldStr, newStr, label) {
  let content = fs.readFileSync(file, 'utf8')
  const count = content.split(oldStr).length - 1
  if (count !== 1) {
    console.error(`FAIL [${label}] in ${file} — found ${count} matches (expected 1)`)
    process.exitCode = 1
    return
  }
  content = content.replace(oldStr, newStr)
  fs.writeFileSync(file, content, 'utf8')
  console.log(`OK   [${label}] in ${file}`)
}

const f = 'src/components/layout/app-sidebar.tsx'

// 1. Import useSidebar alongside the other sidebar UI pieces
replaceOnce(f,
`import {
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
} from "@/components/ui/sidebar"`,
`import {
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
  useSidebar,
} from "@/components/ui/sidebar"`,
  'sidebar: import useSidebar')

// 2. Grab isMobile/setOpenMobile and a small helper to close on nav
replaceOnce(f,
`export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useUser()
  const db = useFirestore()`,
`export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useUser()
  const db = useFirestore()
  const { isMobile, setOpenMobile } = useSidebar()

  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false)
  }`,
  'sidebar: init isMobile/setOpenMobile + helper')

// 3. Close on tapping the Admin link
replaceOnce(f,
`                  <SidebarMenuButton asChild isActive={pathname === "/admin"} tooltip="Admin" className="mx-2 px-4 h-12 rounded-xl transition-all border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10">
                    <Link href="/admin">`,
`                  <SidebarMenuButton asChild isActive={pathname === "/admin"} tooltip="Admin" className="mx-2 px-4 h-12 rounded-xl transition-all border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10">
                    <Link href="/admin" onClick={closeOnMobile}>`,
  'sidebar: close on Admin link tap')

// 4. Close on tapping any main nav item
replaceOnce(f,
`                  <SidebarMenuButton asChild isActive={item.url === "/" ? pathname === "/" : pathname.startsWith(item.url)} tooltip={item.title} className="mx-2 px-4 h-12 rounded-xl transition-all hover:bg-white/5 hover:text-accent data-[active=true]:bg-primary/10 data-[active=true]:text-primary">
                    <Link href={item.url}>`,
`                  <SidebarMenuButton asChild isActive={item.url === "/" ? pathname === "/" : pathname.startsWith(item.url)} tooltip={item.title} className="mx-2 px-4 h-12 rounded-xl transition-all hover:bg-white/5 hover:text-accent data-[active=true]:bg-primary/10 data-[active=true]:text-primary">
                    <Link href={item.url} onClick={closeOnMobile}>`,
  'sidebar: close on main nav item tap')

// 5. Close on tapping Profile link
replaceOnce(f,
`                <SidebarMenuButton asChild isActive={pathname === "/profile"} tooltip="Profile" className="mx-2 px-4 h-12 rounded-xl transition-all hover:bg-white/5 hover:text-accent data-[active=true]:bg-primary/10 data-[active=true]:text-primary">
                  <Link href="/profile">`,
`                <SidebarMenuButton asChild isActive={pathname === "/profile"} tooltip="Profile" className="mx-2 px-4 h-12 rounded-xl transition-all hover:bg-white/5 hover:text-accent data-[active=true]:bg-primary/10 data-[active=true]:text-primary">
                  <Link href="/profile" onClick={closeOnMobile}>`,
  'sidebar: close on Profile link tap')

// 6. Close on tapping the logo/brand link too, for consistency
replaceOnce(f,
`        <Link href="/" className="flex items-center gap-3">`,
`        <Link href="/" className="flex items-center gap-3" onClick={closeOnMobile}>`,
  'sidebar: close on logo tap')

console.log('\nDone.')
