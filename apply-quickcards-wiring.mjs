// Adds the QuickCards menu entries and the admin link. Safe to run twice.
// Edits only: src/components/layout/app-sidebar.tsx and src/app/admin/page.tsx
import fs from 'node:fs'

function patchFile(file, marker, edits) {
  let content = fs.readFileSync(file, 'utf8')
  if (content.includes(marker)) {
    console.log(`${file}: already patched - skipped.`)
    return
  }
  for (const { find, replace } of edits) {
    const count = content.split(find).length - 1
    if (count !== 1) {
      console.error(`${file}: expected exactly 1 match, found ${count} for:\n${find}`)
      process.exit(1)
    }
    content = content.replace(find, () => replace)
  }
  fs.writeFileSync(file, content)
  console.log(`${file}: patched.`)
}

// 1) Floating menu: QuickCards hub + one entry per visible feature
patchFile('src/components/layout/app-sidebar.tsx', 'QuickCardsMenuItems', [
  {
    find: `import { doc } from "firebase/firestore"\n`,
    replace: `import { doc } from "firebase/firestore"\nimport { QuickCardsMenuItems } from "@/components/quickcards/menu-items"\n`,
  },
  {
    find: `              <SidebarMenuItem>\n                <SidebarMenuButton asChild isActive={pathname === "/profile"}`,
    replace: `              <QuickCardsMenuItems pathname={pathname} onNavigate={closeOnMobile} />\n              <SidebarMenuItem>\n                <SidebarMenuButton asChild isActive={pathname === "/profile"}`,
  },
])

// 2) Admin dashboard link
patchFile('src/app/admin/page.tsx', '/admin/quickcards', [
  {
    find: `          <Link href="/admin/analytics">`,
    replace: `          <Link href="/admin/quickcards">
            <Button variant="outline" className="rounded-xl gap-2 glass border-violet-500/30 text-violet-400 hover:bg-violet-500/10">
              <BookOpenText className="h-4 w-4" /> QuickCards
            </Button>
          </Link>
          <Link href="/admin/analytics">`,
  },
])

console.log('Done.')
