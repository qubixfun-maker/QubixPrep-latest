"use client"

import { Network, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useRequireAuth } from "@/hooks/use-require-auth"

export default function MindmapSubjectUnavailablePage() {
  const { checkingAuth } = useRequireAuth()
  if (checkingAuth) return null

  return (
    <div className="h-[80vh] flex flex-col items-center justify-center p-6 text-center gap-4">
      <div className="p-4 rounded-2xl bg-primary/10 text-primary">
        <Network className="h-10 w-10" />
      </div>
      <div>
        <h1 className="text-2xl font-bold">Mindmaps are temporarily unavailable</h1>
        <p className="text-muted-foreground mt-2 max-w-md">
          We're doing some maintenance on this section. Check back soon - everything else in QubixPrep is working as normal.
        </p>
      </div>
      <Link href="/dashboard"><Button className="mt-2"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard</Button></Link>
    </div>
  )
}
