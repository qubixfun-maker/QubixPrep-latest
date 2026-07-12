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

const ROOT = "src/app"

// ---------- 1. Dashboard (src/app/page.tsx) ----------
const dash = `${ROOT}/page.tsx`

replaceOnce(dash,
`      if (!user) { router.push("/signup"); return }`,
`      if (!user) { setCheckingRole(false); return }`,
'dashboard: stop auto-redirect for anon users')

replaceOnce(dash,
`  if (!user) return null

  const firstName = user.displayName?.split(' ')[0] || 'Doctor'`,
`  const firstName = user?.displayName?.split(' ')[0] || 'Doctor'`,
'dashboard: allow anon render, safe firstName')

replaceOnce(dash,
`            <Button asChild size="sm" className="rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 gap-2">
              <Link href="/qbank"><Database className="h-3.5 w-3.5" /> Open QBank</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-xl glass border-white/10 hover:bg-white/5 gap-2">
              <Link href="/mindmaps"><Network className="h-3.5 w-3.5" /> Mindmaps</Link>
            </Button>`,
`            <Button asChild size="sm" className="rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 gap-2">
              <Link href={user ? "/qbank" : "/signup"}><Database className="h-3.5 w-3.5" /> Open QBank</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-xl glass border-white/10 hover:bg-white/5 gap-2">
              <Link href={user ? "/mindmaps" : "/signup"}><Network className="h-3.5 w-3.5" /> Mindmaps</Link>
            </Button>`,
'dashboard: hero CTA buttons gate to signup')

replaceOnce(dash,
`          {features.map((f) => (
            <Link key={f.label} href={f.locked ? '/pricing' : f.href}>`,
`          {features.map((f) => (
            <Link key={f.label} href={!user ? '/signup' : f.locked ? '/pricing' : f.href}>`,
'dashboard: feature cards gate signup/pricing')

replaceOnce(dash,
`          <Link href={activeTab === 'qbank' ? '/qbank' : '/mindmaps'} className="ml-auto text-xs text-muted-foreground hover:text-white flex items-center gap-1 transition-colors">`,
`          <Link href={!user ? '/signup' : (activeTab === 'qbank' ? '/qbank' : '/mindmaps')} className="ml-auto text-xs text-muted-foreground hover:text-white flex items-center gap-1 transition-colors">`,
'dashboard: "All" link gate')

replaceOnce(dash,
`              const href = activeTab === 'qbank' ? \`/qbank/\${subject.id}\` : \`/mindmaps/\${subject.id}\`
              return (
                <Link key={subject.id} href={href}>`,
`              const contentHref = activeTab === 'qbank' ? \`/qbank/\${subject.id}\` : \`/mindmaps/\${subject.id}\`
              const href = !user ? '/signup' : contentHref
              return (
                <Link key={subject.id} href={href}>`,
'dashboard: subject tiles gate signup')

// ---------- 2. qbank/[id]/page.tsx ----------
const qbankId = `${ROOT}/qbank/[id]/page.tsx`

replaceOnce(qbankId,
`import { useMemo, use, useState, useEffect } from "react"
import ReactMarkdown from "react-markdown"`,
`import { useMemo, use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown"`,
'qbank/[id]: add useRouter import')

replaceOnce(qbankId,
`  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()
  const { isFree, canAccessAI } = usePlan()`,
`  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()
  const router = useRouter()
  const { isFree, canAccessAI } = usePlan()`,
'qbank/[id]: init router')

replaceOnce(qbankId,
`  async function handleAskAi() {
    if (!selectedTopicQuestions) return
    const currentQ = selectedTopicQuestions[currentIndex]
    setIsAiLoading(true)`,
`  async function handleAskAi() {
    if (!user) { router.push('/signup'); return }
    if (!canAccessAI) { router.push('/pricing'); return }
    if (!selectedTopicQuestions) return
    const currentQ = selectedTopicQuestions[currentIndex]
    setIsAiLoading(true)`,
'qbank/[id]: guard handleAskAi')

// ---------- 3. qbank/pdf-quiz/[id]/page.tsx ----------
const pdfQuiz = `${ROOT}/qbank/pdf-quiz/[id]/page.tsx`

replaceOnce(pdfQuiz,
`import { use, useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/firebase"`,
`import { use, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/firebase"
import { usePlan } from "@/hooks/use-plan"`,
'pdf-quiz: add useRouter/usePlan import')

replaceOnce(pdfQuiz,
`  const { id: qbankId } = use(params)
  const { user } = useUser()
  const { toast } = useToast()`,
`  const { id: qbankId } = use(params)
  const { user } = useUser()
  const { toast } = useToast()
  const router = useRouter()
  const { canAccessAI } = usePlan()`,
'pdf-quiz: init router/plan')

replaceOnce(pdfQuiz,
`  async function handleAskAi() {
    const currentQ = questions[currentIndex]
    const optsArr = [currentQ.option_a, currentQ.option_b, currentQ.option_c, currentQ.option_d]
    const correctIdx = ['a', 'b', 'c', 'd'].indexOf(currentQ.correct_answer?.toLowerCase() || 'a')
    
    setIsAiLoading(true)`,
`  async function handleAskAi() {
    if (!user) { router.push('/signup'); return }
    if (!canAccessAI) { router.push('/pricing'); return }
    const currentQ = questions[currentIndex]
    const optsArr = [currentQ.option_a, currentQ.option_b, currentQ.option_c, currentQ.option_d]
    const correctIdx = ['a', 'b', 'c', 'd'].indexOf(currentQ.correct_answer?.toLowerCase() || 'a')
    
    setIsAiLoading(true)`,
'pdf-quiz: guard handleAskAi')

// ---------- 4. pyq/start/page.tsx ----------
const pyq = `${ROOT}/pyq/start/page.tsx`

replaceOnce(pyq,
`import { useUser } from "@/firebase"
import { clinicalTutorFlow } from "@/ai/flows/ai-clinical-tutor"

function PYQSessionContent() {
  const { user } = useUser()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()`,
`import { useUser } from "@/firebase"
import { usePlan } from "@/hooks/use-plan"
import { clinicalTutorFlow } from "@/ai/flows/ai-clinical-tutor"

function PYQSessionContent() {
  const { user } = useUser()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const { canAccessAI } = usePlan()`,
'pyq/start: add usePlan')

replaceOnce(pyq,
`  async function handleAskAi() {
    const q = questions[currentIndex]
    const options = [q.option1, q.option2, q.option3, q.option4].filter(Boolean)
    setIsAiLoading(true)`,
`  async function handleAskAi() {
    if (!user) { router.push('/signup'); return }
    if (!canAccessAI) { router.push('/pricing'); return }
    const q = questions[currentIndex]
    const options = [q.option1, q.option2, q.option3, q.option4].filter(Boolean)
    setIsAiLoading(true)`,
'pyq/start: guard handleAskAi')

// ---------- 5. test-series/start/page.tsx ----------
const ts = `${ROOT}/test-series/start/page.tsx`

replaceOnce(ts,
`import { useUser } from "@/firebase"
import { clinicalTutorFlow } from "@/ai/flows/ai-clinical-tutor"
import { analyzeTestPerformance } from "@/ai/flows/ai-performance-analyzer"

function QuizSessionContent() {
  const { user } = useUser()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()`,
`import { useUser } from "@/firebase"
import { usePlan } from "@/hooks/use-plan"
import { clinicalTutorFlow } from "@/ai/flows/ai-clinical-tutor"
import { analyzeTestPerformance } from "@/ai/flows/ai-performance-analyzer"

function QuizSessionContent() {
  const { user } = useUser()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const { canAccessAI } = usePlan()`,
'test-series/start: add usePlan')

replaceOnce(ts,
`  async function handleAskAi() {
    const currentQ = questions[currentIndex]
    const options = [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4]
    setIsAiLoading(true)`,
`  async function handleAskAi() {
    if (!user) { router.push('/signup'); return }
    if (!canAccessAI) { router.push('/pricing'); return }
    const currentQ = questions[currentIndex]
    const options = [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4]
    setIsAiLoading(true)`,
'test-series/start: guard handleAskAi')

console.log('\nDone.')
