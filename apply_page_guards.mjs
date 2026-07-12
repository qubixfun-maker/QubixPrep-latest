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

const ROOT = 'src/app'
const SPINNER = `<div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>`

// ---------- qbank/page.tsx ----------
{
  const f = `${ROOT}/qbank/page.tsx`
  replaceOnce(f,
`import { Input } from "@/components/ui/input"
import Link from "next/link"`,
`import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRequireAuth } from "@/hooks/use-require-auth"`,
    'qbank list: import hook')
  replaceOnce(f,
`  }, [data])

  return (`,
`  }, [data])

  const { checkingAuth } = useRequireAuth()
  if (checkingAuth) return ${SPINNER}

  return (`,
    'qbank list: add guard')
}

// ---------- mindmaps/page.tsx ----------
{
  const f = `${ROOT}/mindmaps/page.tsx`
  replaceOnce(f,
`import { Input } from "@/components/ui/input"
import Link from "next/link"`,
`import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRequireAuth } from "@/hooks/use-require-auth"`,
    'mindmaps list: import hook')
  replaceOnce(f,
`  }, [data])

  return (`,
`  }, [data])

  const { checkingAuth } = useRequireAuth()
  if (checkingAuth) return ${SPINNER}

  return (`,
    'mindmaps list: add guard')
}

// ---------- notes/page.tsx ----------
{
  const f = `${ROOT}/notes/page.tsx`
  replaceOnce(f,
`import { Input } from "@/components/ui/input"
import Link from "next/link"`,
`import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRequireAuth } from "@/hooks/use-require-auth"`,
    'notes list: import hook')
  replaceOnce(f,
`  }, [data])

  return (`,
`  }, [data])

  const { checkingAuth } = useRequireAuth()
  if (checkingAuth) return ${SPINNER}

  return (`,
    'notes list: add guard')
}

// ---------- videos/page.tsx ----------
{
  const f = `${ROOT}/videos/page.tsx`
  replaceOnce(f,
`import { Input } from "@/components/ui/input"
import Link from "next/link"`,
`import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRequireAuth } from "@/hooks/use-require-auth"`,
    'videos list: import hook')
  replaceOnce(f,
`  const { data: subjects, loading } = useCollection(subjectsQuery)

  return (`,
`  const { data: subjects, loading } = useCollection(subjectsQuery)

  const { checkingAuth } = useRequireAuth()
  if (checkingAuth) return ${SPINNER}

  return (`,
    'videos list: add guard')
}

// ---------- search/page.tsx ----------
{
  const f = `${ROOT}/search/page.tsx`
  replaceOnce(f,
`import { useFirestore, useCollection } from "@/firebase"
import { collection, getDocs } from "firebase/firestore"
import { supabase } from "@/lib/supabase"`,
`import { useFirestore, useCollection } from "@/firebase"
import { collection, getDocs } from "firebase/firestore"
import { supabase } from "@/lib/supabase"
import { useRequireAuth } from "@/hooks/use-require-auth"`,
    'search: import hook')
  replaceOnce(f,
`      case "QBank": return "text-orange-400"
    }
  }

  return (`,
`      case "QBank": return "text-orange-400"
    }
  }

  const { checkingAuth } = useRequireAuth()
  if (checkingAuth) return ${SPINNER}

  return (`,
    'search: add guard')
}

// ---------- test-series/page.tsx ----------
{
  const f = `${ROOT}/test-series/page.tsx`
  replaceOnce(f,
`import { usePlan } from "@/hooks/use-plan"
import { UpgradeGate } from "@/components/upgrade-gate"`,
`import { usePlan } from "@/hooks/use-plan"
import { UpgradeGate } from "@/components/upgrade-gate"
import { useRequireAuth } from "@/hooks/use-require-auth"`,
    'test-series list: import hook')
  replaceOnce(f,
`  const { canAccessContent, loading: planLoading } = usePlan()
  const router = useRouter()`,
`  const { canAccessContent, loading: planLoading } = usePlan()
  const router = useRouter()
  const { checkingAuth } = useRequireAuth()`,
    'test-series list: init hook')
  replaceOnce(f,
`  if (!canAccessContent) {
    return (
      <div className="max-w-2xl mx-auto p-8 md:p-12 flex items-center justify-center min-h-[60vh]">
        <UpgradeGate
          type="content"
          title="Custom Quiz — Scholar & Clinician Only"
          description="Upgrade to Scholar or Clinician plan to access AI-powered custom test series with topic selection, timed mode, and performance analytics."
        />
      </div>
    )
  }`,
`  if (checkingAuth) return ${SPINNER}

  if (!canAccessContent) {
    return (
      <div className="max-w-2xl mx-auto p-8 md:p-12 flex items-center justify-center min-h-[60vh]">
        <UpgradeGate
          type="content"
          title="Custom Quiz — Scholar & Clinician Only"
          description="Upgrade to Scholar or Clinician plan to access AI-powered custom test series with topic selection, timed mode, and performance analytics."
        />
      </div>
    )
  }`,
    'test-series list: add guard')
}

// ---------- ai-tools/page.tsx (hub — was a server component, no hooks) ----------
{
  const f = `${ROOT}/ai-tools/page.tsx`
  replaceOnce(f,
`import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BrainCircuit, FileText, LayoutList, Wand2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";`,
`"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BrainCircuit, FileText, LayoutList, Wand2, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/hooks/use-require-auth";`,
    'ai-tools hub: add use client + imports')
  replaceOnce(f,
`export default function AIToolsPage() {
  return (`,
`export default function AIToolsPage() {
  const { checkingAuth } = useRequireAuth()
  if (checkingAuth) return ${SPINNER}

  return (`,
    'ai-tools hub: add guard')
}

// ---------- mindmaps/[id]/page.tsx ----------
{
  const f = `${ROOT}/mindmaps/[id]/page.tsx`
  replaceOnce(f,
`import { usePlan } from '@/hooks/use-plan'
import { UpgradeGate } from '@/components/upgrade-gate'`,
`import { usePlan } from '@/hooks/use-plan'
import { UpgradeGate } from '@/components/upgrade-gate'
import { useRequireAuth } from '@/hooks/use-require-auth'`,
    'mindmaps/[id]: import hook')
  replaceOnce(f,
`  const { canAccessContent, loading: planLoading } = usePlan()`,
`  const { canAccessContent, loading: planLoading } = usePlan()
  const { checkingAuth } = useRequireAuth()`,
    'mindmaps/[id]: init hook')
  replaceOnce(f,
`  if (subjectLoading || planLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>`,
`  if (checkingAuth || subjectLoading || planLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>`,
    'mindmaps/[id]: merge guard')
}

// ---------- mindmaps/[id]/[mindmapId]/page.tsx ----------
{
  const f = `${ROOT}/mindmaps/[id]/[mindmapId]/page.tsx`
  replaceOnce(f,
`import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from "react-zoom-pan-pinch"`,
`import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from "react-zoom-pan-pinch"
import { useRequireAuth } from '@/hooks/use-require-auth'`,
    'mindmap viewer: import hook')
  replaceOnce(f,
`  const [imageLoaded, setImageLoaded] = useState(false)`,
`  const [imageLoaded, setImageLoaded] = useState(false)
  const { checkingAuth } = useRequireAuth()`,
    'mindmap viewer: init hook')
  replaceOnce(f,
`  if (loading) return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-primary" /></div>`,
`  if (checkingAuth || loading) return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-primary" /></div>`,
    'mindmap viewer: merge guard')
}

// ---------- videos/[id]/page.tsx ----------
{
  const f = `${ROOT}/videos/[id]/page.tsx`
  replaceOnce(f,
`import { usePlan } from '@/hooks/use-plan'
import { UpgradeGate } from '@/components/upgrade-gate'`,
`import { usePlan } from '@/hooks/use-plan'
import { UpgradeGate } from '@/components/upgrade-gate'
import { useRequireAuth } from '@/hooks/use-require-auth'`,
    'videos/[id]: import hook')
  replaceOnce(f,
`  const { canAccessContent } = usePlan()`,
`  const { canAccessContent } = usePlan()
  const { checkingAuth } = useRequireAuth()`,
    'videos/[id]: init hook')
  replaceOnce(f,
`  if (subjectLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>`,
`  if (checkingAuth || subjectLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>`,
    'videos/[id]: merge guard')
}

// ---------- pyq/page.tsx ----------
{
  const f = `${ROOT}/pyq/page.tsx`
  replaceOnce(f,
`import { usePlan } from "@/hooks/use-plan"
import { UpgradeGate } from "@/components/upgrade-gate"`,
`import { usePlan } from "@/hooks/use-plan"
import { UpgradeGate } from "@/components/upgrade-gate"
import { useRequireAuth } from "@/hooks/use-require-auth"`,
    'pyq setup: import hook')
  replaceOnce(f,
`  const { isPro, loading: planLoading } = usePlan()`,
`  const { isPro, loading: planLoading } = usePlan()
  const { checkingAuth } = useRequireAuth()`,
    'pyq setup: init hook')
  replaceOnce(f,
`  if (planLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>`,
`  if (checkingAuth || planLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>`,
    'pyq setup: merge guard')
}

// ---------- qbank/[id]/page.tsx ----------
{
  const f = `${ROOT}/qbank/[id]/page.tsx`
  replaceOnce(f,
`import { usePlan } from '@/hooks/use-plan'
import { UpgradeGate } from '@/components/upgrade-gate'`,
`import { usePlan } from '@/hooks/use-plan'
import { UpgradeGate } from '@/components/upgrade-gate'
import { useRequireAuth } from '@/hooks/use-require-auth'`,
    'qbank/[id]: import hook')
  replaceOnce(f,
`  const { isFree, canAccessAI } = usePlan()`,
`  const { isFree, canAccessAI } = usePlan()
  const { checkingAuth } = useRequireAuth()`,
    'qbank/[id]: init hook')
  replaceOnce(f,
`  if (subjectLoading || qLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>`,
`  if (checkingAuth || subjectLoading || qLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>`,
    'qbank/[id]: merge guard')
}

// ---------- qbank/pdf-quiz/[id]/page.tsx ----------
{
  const f = `${ROOT}/qbank/pdf-quiz/[id]/page.tsx`
  replaceOnce(f,
`import { clinicalTutorFlow } from "@/ai/flows/ai-clinical-tutor"

export default function PdfQuizPage`,
`import { clinicalTutorFlow } from "@/ai/flows/ai-clinical-tutor"
import { useRequireAuth } from "@/hooks/use-require-auth"

export default function PdfQuizPage`,
    'pdf-quiz: import hook')
  replaceOnce(f,
`  const { id: qbankId } = use(params)
  const { user } = useUser()
  const { toast } = useToast()`,
`  const { id: qbankId } = use(params)
  const { user } = useUser()
  const { toast } = useToast()
  const { checkingAuth } = useRequireAuth()`,
    'pdf-quiz: init hook')
  replaceOnce(f,
`  if (loading) return <div className="h-screen flex flex-col items-center justify-center gap-4 bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Initializing Simulation Hub...</p></div>`,
`  if (checkingAuth || loading) return <div className="h-screen flex flex-col items-center justify-center gap-4 bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Initializing Simulation Hub...</p></div>`,
    'pdf-quiz: merge guard')
}

// ---------- notes/[id]/page.tsx ----------
{
  const f = `${ROOT}/notes/[id]/page.tsx`
  replaceOnce(f,
`import { usePlan } from '@/hooks/use-plan'
import { UpgradeGate } from '@/components/upgrade-gate'`,
`import { usePlan } from '@/hooks/use-plan'
import { UpgradeGate } from '@/components/upgrade-gate'
import { useRequireAuth } from '@/hooks/use-require-auth'`,
    'notes/[id]: import hook')
  replaceOnce(f,
`  const { canAccessContent } = usePlan()`,
`  const { canAccessContent } = usePlan()
  const { checkingAuth } = useRequireAuth()`,
    'notes/[id]: init hook')
  replaceOnce(f,
`  if (subjectLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    )
  }`,
`  if (checkingAuth || subjectLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    )
  }`,
    'notes/[id]: merge guard')
}

// ---------- notes/[id]/[topicId]/page.tsx ----------
{
  const f = `${ROOT}/notes/[id]/[topicId]/page.tsx`
  replaceOnce(f,
`import { usePlan } from '@/hooks/use-plan'
import { UpgradeGate } from '@/components/upgrade-gate'`,
`import { usePlan } from '@/hooks/use-plan'
import { UpgradeGate } from '@/components/upgrade-gate'
import { useRequireAuth } from '@/hooks/use-require-auth'`,
    'notes topic viewer: import hook')
  replaceOnce(f,
`  const { canAccessContent, canAccessAI } = usePlan()`,
`  const { canAccessContent, canAccessAI } = usePlan()
  const { checkingAuth } = useRequireAuth()`,
    'notes topic viewer: init hook')
  replaceOnce(f,
`  if (loading || progressLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0a0c]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Syncing Secure Canvas...</p>
        </div>
      </div>
    )
  }`,
`  if (checkingAuth || loading || progressLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0a0c]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Syncing Secure Canvas...</p>
        </div>
      </div>
    )
  }`,
    'notes topic viewer: merge guard')
}

// ---------- ai-tools/quiz/page.tsx ----------
{
  const f = `${ROOT}/ai-tools/quiz/page.tsx`
  replaceOnce(f,
`import { UpgradeGate } from "@/components/upgrade-gate";`,
`import { UpgradeGate } from "@/components/upgrade-gate";
import { useRequireAuth } from "@/hooks/use-require-auth";`,
    'ai quiz generator: import hook')
  replaceOnce(f,
`  const { user } = useUser();`,
`  const { user } = useUser();
  const { checkingAuth } = useRequireAuth();`,
    'ai quiz generator: init hook')
  replaceOnce(f,
`  if (planLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }`,
`  if (checkingAuth || planLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }`,
    'ai quiz generator: merge guard')
}

// ---------- ai-tools/summarizer/page.tsx ----------
{
  const f = `${ROOT}/ai-tools/summarizer/page.tsx`
  replaceOnce(f,
`import { UpgradeGate } from "@/components/upgrade-gate";`,
`import { UpgradeGate } from "@/components/upgrade-gate";
import { useRequireAuth } from "@/hooks/use-require-auth";`,
    'ai summarizer: import hook')
  replaceOnce(f,
`  const { user } = useUser();`,
`  const { user } = useUser();
  const { checkingAuth } = useRequireAuth();`,
    'ai summarizer: init hook')
  replaceOnce(f,
`  if (planLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }`,
`  if (checkingAuth || planLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }`,
    'ai summarizer: merge guard')
}

// ---------- pyq/start/page.tsx ----------
{
  const f = `${ROOT}/pyq/start/page.tsx`
  replaceOnce(f,
`import { clinicalTutorFlow } from "@/ai/flows/ai-clinical-tutor"

function PYQSessionContent`,
`import { clinicalTutorFlow } from "@/ai/flows/ai-clinical-tutor"
import { useRequireAuth } from "@/hooks/use-require-auth"

function PYQSessionContent`,
    'pyq/start: import hook')
  replaceOnce(f,
`  const router = useRouter()
  const { toast } = useToast()`,
`  const router = useRouter()
  const { toast } = useToast()
  const { checkingAuth } = useRequireAuth()`,
    'pyq/start: init hook')
  replaceOnce(f,
`  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>`,
`  if (checkingAuth || loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>`,
    'pyq/start: merge guard')
}

// ---------- test-series/start/page.tsx ----------
{
  const f = `${ROOT}/test-series/start/page.tsx`
  replaceOnce(f,
`import { analyzeTestPerformance } from "@/ai/flows/ai-performance-analyzer"

function QuizSessionContent`,
`import { analyzeTestPerformance } from "@/ai/flows/ai-performance-analyzer"
import { useRequireAuth } from "@/hooks/use-require-auth"

function QuizSessionContent`,
    'test-series/start: import hook')
  replaceOnce(f,
`  const router = useRouter()
  const { toast } = useToast()`,
`  const router = useRouter()
  const { toast } = useToast()
  const { checkingAuth } = useRequireAuth()`,
    'test-series/start: init hook')
  replaceOnce(f,
`  if (loading) return <div className="h-screen flex flex-col items-center justify-center space-y-4 px-4 text-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="text-xs font-bold uppercase tracking-widest animate-pulse">Filtering Clinical Pool...</p></div>`,
`  if (checkingAuth || loading) return <div className="h-screen flex flex-col items-center justify-center space-y-4 px-4 text-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="text-xs font-bold uppercase tracking-widest animate-pulse">Filtering Clinical Pool...</p></div>`,
    'test-series/start: merge guard')
}

// ---------- profile/page.tsx ----------
{
  const f = `${ROOT}/profile/page.tsx`
  replaceOnce(f,
`import { usePlan } from '@/hooks/use-plan'
import Link from 'next/link'`,
`import { usePlan } from '@/hooks/use-plan'
import Link from 'next/link'
import { useRequireAuth } from '@/hooks/use-require-auth'`,
    'profile: import hook')
  replaceOnce(f,
`  const { plan, isFree, isBasic, isPro } = usePlan()`,
`  const { plan, isFree, isBasic, isPro } = usePlan()
  const { checkingAuth } = useRequireAuth()`,
    'profile: init hook')
  replaceOnce(f,
`  if (authLoading || profileLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    )
  }`,
`  if (checkingAuth || authLoading || profileLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    )
  }`,
    'profile: merge guard')
}

// ---------- affiliate/page.tsx ----------
{
  const f = `${ROOT}/affiliate/page.tsx`
  replaceOnce(f,
`import Link from "next/link"

export default function AffiliatePage`,
`import Link from "next/link"
import { useRequireAuth } from "@/hooks/use-require-auth"

export default function AffiliatePage`,
    'affiliate: import hook')
  replaceOnce(f,
`  const { isFree, isBasic, isPro, plan, loading: planLoading } = usePlan()`,
`  const { isFree, isBasic, isPro, plan, loading: planLoading } = usePlan()
  const { checkingAuth } = useRequireAuth()`,
    'affiliate: init hook')
  replaceOnce(f,
`  if (loading || planLoading || pageLoading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>`,
`  if (checkingAuth || loading || planLoading || pageLoading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>`,
    'affiliate: merge guard')
}

console.log('\nDone.')
