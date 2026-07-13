import fs from 'fs'

const f = 'src/components/layout/app-sidebar.tsx'
const original = fs.readFileSync(f, 'utf8')

if (original.includes('useSidebar')) {
  console.log('Sidebar already has the auto-collapse patch — nothing to do.')
  process.exit(0)
}

function replaceOnce(content, oldStr, newStr, label) {
  const count = content.split(oldStr).length - 1
  if (count !== 1) {
    console.error(`FAIL [${label}] — found ${count} matches (expected 1)`)
    process.exitCode = 1
    return content
  }
  console.log(`OK   [${label}]`)
  return content.replace(oldStr, newStr)
}

let content = original

content = replaceOnce(content,
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
  'import useSidebar')

content = replaceOnce(content,
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
  'init isMobile/setOpenMobile + helper')

content = replaceOnce(content,
`                  <SidebarMenuButton asChild isActive={pathname === "/admin"} tooltip="Admin" className="mx-2 px-4 h-12 rounded-xl transition-all border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10">
                    <Link href="/admin">`,
`                  <SidebarMenuButton asChild isActive={pathname === "/admin"} tooltip="Admin" className="mx-2 px-4 h-12 rounded-xl transition-all border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10">
                    <Link href="/admin" onClick={closeOnMobile}>`,
  'close on Admin link tap')

content = replaceOnce(content,
`                  <SidebarMenuButton asChild isActive={item.url === "/" ? pathname === "/" : pathname.startsWith(item.url)} tooltip={item.title} className="mx-2 px-4 h-12 rounded-xl transition-all hover:bg-white/5 hover:text-accent data-[active=true]:bg-primary/10 data-[active=true]:text-primary">
                    <Link href={item.url}>`,
`                  <SidebarMenuButton asChild isActive={item.url === "/" ? pathname === "/" : pathname.startsWith(item.url)} tooltip={item.title} className="mx-2 px-4 h-12 rounded-xl transition-all hover:bg-white/5 hover:text-accent data-[active=true]:bg-primary/10 data-[active=true]:text-primary">
                    <Link href={item.url} onClick={closeOnMobile}>`,
  'close on main nav item tap')

content = replaceOnce(content,
`                <SidebarMenuButton asChild isActive={pathname === "/profile"} tooltip="Profile" className="mx-2 px-4 h-12 rounded-xl transition-all hover:bg-white/5 hover:text-accent data-[active=true]:bg-primary/10 data-[active=true]:text-primary">
                  <Link href="/profile">`,
`                <SidebarMenuButton asChild isActive={pathname === "/profile"} tooltip="Profile" className="mx-2 px-4 h-12 rounded-xl transition-all hover:bg-white/5 hover:text-accent data-[active=true]:bg-primary/10 data-[active=true]:text-primary">
                  <Link href="/profile" onClick={closeOnMobile}>`,
  'close on Profile link tap')

content = replaceOnce(content,
`        <Link href="/" className="flex items-center gap-3">`,
`        <Link href="/" className="flex items-center gap-3" onClick={closeOnMobile}>`,
  'close on logo tap')

if (process.exitCode !== 1) {
  fs.writeFileSync(f, content, 'utf8')
  console.log('\nSidebar patched successfully.')
} else {
  console.log('\nNo changes written — a step above failed. Paste the FAIL line to Claude.')
}
