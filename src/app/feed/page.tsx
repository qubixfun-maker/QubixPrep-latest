"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useUser, useFirestore } from "@/firebase"
import { collection, doc, getDoc, getDocs, increment, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore"
import { Loader2, X, Flame, Check, RotateCcw, Trophy, ChevronLeft, Eye } from "lucide-react"
import Link from "next/link"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { getSubjectColor } from "@/lib/subject-colors"
import { Button } from "@/components/ui/button"

// The Study Feed: a TikTok/Web-Stories-style vertical swipe feed built from already-
// generated mindmap data. Each mindmap branch tree gets flattened into individual
// full-screen cards, mixed and shuffled across every subject/chapter the student
// picked, with photo backdrops (Pexels, cached per topic via /api/topic-image),
// double-tap-to-master interactions, a daily streak, and quick recall checks mixed in.

const DAILY_GOAL = 15
const MAX_SESSION_CARDS = 80

type MindmapNodeData = {
  name: string
  definition?: string
  mechanism?: string
  examples?: string
  branches?: MindmapNodeData[]
}

type FeedCard = {
  cardId: string
  subjectId: string
  subjectName: string
  chapterTitle: string
  mindmapId: string
  name: string
  definition?: string
  mechanism?: string
  examples?: string
  path: string
}

function slugify(str: string): string {
  return str.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 100) || 'x'
}

// Mirrors the mindmap viewer's own tree shape (subjects/{id}/mindmaps/{id}.data =
// { centralTopic, branches }). Skips pure organizational headers (a node with no
// content of its own and no leaf status - just a container for children) so the feed
// only ever shows cards with something real to read, matching the reference prototype.
function flattenBranches(
  node: MindmapNodeData,
  ctx: { subjectId: string; subjectName: string; chapterTitle: string; mindmapId: string },
  parentPath: string,
  out: FeedCard[]
) {
  const currentPath = parentPath ? `${parentPath} > ${node.name}` : node.name
  const hasContent = !!(node.definition || node.mechanism || node.examples)
  const isLeaf = !node.branches || node.branches.length === 0
  if (hasContent || isLeaf) {
    out.push({
      cardId: `${ctx.mindmapId}::${slugify(currentPath)}`,
      subjectId: ctx.subjectId,
      subjectName: ctx.subjectName,
      chapterTitle: ctx.chapterTitle,
      mindmapId: ctx.mindmapId,
      name: node.name,
      definition: node.definition,
      mechanism: node.mechanism,
      examples: node.examples,
      path: currentPath,
    })
  }
  ;(node.branches || []).forEach((child) => flattenBranches(child, ctx, currentPath, out))
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

type Phase = 'setup' | 'session' | 'recap'

export default function StudyFeedPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { checkingAuth } = useRequireAuth()

  const [phase, setPhase] = useState<Phase>('setup')
  const [starting, setStarting] = useState(false)

  // --- Setup: mandatory subject picker, optional per-subject chapter picker ---
  const [subjects, setSubjects] = useState<any[]>([])
  const [subjectsLoading, setSubjectsLoading] = useState(true)
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set())
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set())
  const [subjectMindmaps, setSubjectMindmaps] = useState<Record<string, any[]>>({})
  const [loadingChaptersFor, setLoadingChaptersFor] = useState<string | null>(null)
  const [selectedChapters, setSelectedChapters] = useState<Record<string, Set<string>>>({})

  useEffect(() => {
    if (!db) return
    getDocs(collection(db, 'subjects')).then((snap) => {
      setSubjects(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setSubjectsLoading(false)
    }).catch(() => setSubjectsLoading(false))
  }, [db])

  async function toggleSubject(subjectId: string) {
    setSelectedSubjects((prev) => {
      const next = new Set(prev)
      if (next.has(subjectId)) next.delete(subjectId)
      else next.add(subjectId)
      return next
    })
    if (!subjectMindmaps[subjectId] && db) {
      setLoadingChaptersFor(subjectId)
      try {
        const snap = await getDocs(collection(db, 'subjects', subjectId, 'mindmaps'))
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        setSubjectMindmaps((prev) => ({ ...prev, [subjectId]: list }))
        setSelectedChapters((prev) => ({ ...prev, [subjectId]: new Set(list.map((m: any) => m.id)) }))
      } catch {
        setSubjectMindmaps((prev) => ({ ...prev, [subjectId]: [] }))
      } finally {
        setLoadingChaptersFor(null)
      }
    }
  }

  function toggleExpanded(subjectId: string) {
    setExpandedSubjects((prev) => {
      const next = new Set(prev)
      if (next.has(subjectId)) next.delete(subjectId)
      else next.add(subjectId)
      return next
    })
  }

  function toggleChapter(subjectId: string, mindmapId: string) {
    setSelectedChapters((prev) => {
      const current = new Set(prev[subjectId] || [])
      if (current.has(mindmapId)) current.delete(mindmapId)
      else current.add(mindmapId)
      return { ...prev, [subjectId]: current }
    })
  }

  // --- Session state ---
  const [cards, setCards] = useState<FeedCard[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, mastered: 0, xp: 0 })
  const [profileStats, setProfileStats] = useState({ streakCount: 0, lastStudyDate: '', totalXp: 0 })
  const streakUpdatedRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastTapRef = useRef<Record<string, number>>({})
  const [heartPop, setHeartPop] = useState<string | null>(null)
  const [revealed, setRevealed] = useState<Set<string>>(new Set())

  async function handleStart() {
    if (selectedSubjects.size === 0 || !db) return
    setStarting(true)
    try {
      const allCards: FeedCard[] = []
      for (const subjectId of selectedSubjects) {
        const subject = subjects.find((s) => s.id === subjectId)
        const subjectName = subject?.name || subjectId
        const mindmaps = subjectMindmaps[subjectId] || []
        const chosenIds = selectedChapters[subjectId] || new Set(mindmaps.map((m) => m.id))
        for (const mm of mindmaps) {
          if (!chosenIds.has(mm.id)) continue
          const rootBranches: MindmapNodeData[] = mm.data?.branches || []
          const chapterTitle = mm.title || mm.data?.centralTopic || 'Chapter'
          rootBranches.forEach((branch) =>
            flattenBranches(
              branch,
              { subjectId, subjectName, chapterTitle, mindmapId: mm.id },
              mm.data?.centralTopic || chapterTitle,
              allCards
            )
          )
        }
      }

      let masteredIds = new Set<string>()
      if (user) {
        try {
          const masteredSnap = await getDocs(query(collection(db, 'users', user.uid, 'feedProgress'), where('status', '==', 'mastered')))
          masteredSnap.docs.forEach((d) => masteredIds.add(d.id))
        } catch { /* progress fetch failing shouldn't block studying */ }
      }

      let pool = allCards.filter((c) => !masteredIds.has(c.cardId))
      // Everything in the current selection is already mastered - replay rather than
      // showing an empty feed, so revisiting a fully-mastered subject still works.
      if (pool.length === 0) pool = allCards
      pool = shuffle(pool).slice(0, MAX_SESSION_CARDS)

      // Load current streak/XP once per session so the first mastery of the day can
      // compute the streak update correctly.
      if (user) {
        try {
          const profileSnap = await getDoc(doc(db, 'users', user.uid))
          const data = profileSnap.data() as any
          setProfileStats({
            streakCount: data?.streakCount || 0,
            lastStudyDate: data?.lastStudyDate || '',
            totalXp: data?.totalXp || 0,
          })
        } catch { /* non-critical */ }
      }

      streakUpdatedRef.current = false
      setCards(pool)
      setActiveIndex(0)
      setSessionStats({ reviewed: 0, mastered: 0, xp: 0 })
      setRevealed(new Set())
      setPhase(pool.length > 0 ? 'session' : 'setup')
    } finally {
      setStarting(false)
    }
  }

  // --- Photo backdrops: fetch for the active card + a couple ahead, cached client-side ---
  const [images, setImages] = useState<Record<string, { url: string | null; photographer?: string; photographerUrl?: string }>>({})
  const fetchingRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (phase !== 'session') return
    const indexesToFetch = [activeIndex, activeIndex + 1, activeIndex - 1, activeIndex + 2].filter((i) => i >= 0 && i < cards.length)
    indexesToFetch.forEach((i) => {
      const card = cards[i]
      if (!card) return
      if (images[card.cardId] !== undefined) return
      if (fetchingRef.current.has(card.cardId)) return
      fetchingRef.current.add(card.cardId)
      fetch(`/api/topic-image?topic=${encodeURIComponent(card.name)}&subject=${encodeURIComponent(card.subjectName)}`)
        .then((r) => r.json())
        .then((data) => setImages((prev) => ({ ...prev, [card.cardId]: { url: data.url || null, photographer: data.photographer, photographerUrl: data.photographerUrl } })))
        .catch(() => setImages((prev) => ({ ...prev, [card.cardId]: { url: null } })))
    })
  }, [activeIndex, cards, phase])

  // --- Scroll tracking ---
  function handleScroll() {
    const el = containerRef.current
    if (!el) return
    const index = Math.round(el.scrollTop / el.clientHeight)
    setActiveIndex((prev) => (prev !== index ? index : prev))
    if (index >= cards.length && cards.length > 0) setPhase('recap')
  }

  function scrollToNext() {
    containerRef.current?.scrollBy({ top: containerRef.current.clientHeight, behavior: 'smooth' })
  }

  async function markCard(card: FeedCard, status: 'mastered' | 'learning') {
    if (!user || !db) return
    const xpDelta = status === 'mastered' ? 10 : 0
    try {
      await setDoc(doc(db, 'users', user.uid, 'feedProgress', card.cardId), {
        status,
        subjectId: card.subjectId,
        topicName: card.name,
        updatedAt: serverTimestamp(),
      })

      if (!streakUpdatedRef.current) {
        streakUpdatedRef.current = true
        const today = new Date().toISOString().slice(0, 10)
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
        const newStreak = profileStats.lastStudyDate === today
          ? profileStats.streakCount
          : (profileStats.lastStudyDate === yesterday ? profileStats.streakCount + 1 : 1)
        await updateDoc(doc(db, 'users', user.uid), { streakCount: newStreak, lastStudyDate: today, totalXp: increment(xpDelta) })
        setProfileStats((prev) => ({ ...prev, streakCount: newStreak, lastStudyDate: today, totalXp: prev.totalXp + xpDelta }))
      } else if (xpDelta > 0) {
        await updateDoc(doc(db, 'users', user.uid), { totalXp: increment(xpDelta) })
        setProfileStats((prev) => ({ ...prev, totalXp: prev.totalXp + xpDelta }))
      }
    } catch { /* progress write failing shouldn't block the scroll experience */ }

    setSessionStats((prev) => ({ reviewed: prev.reviewed + 1, mastered: prev.mastered + (status === 'mastered' ? 1 : 0), xp: prev.xp + xpDelta }))

    if (status === 'mastered') {
      setHeartPop(card.cardId)
      setTimeout(() => setHeartPop(null), 800)
      setTimeout(scrollToNext, 550)
    } else {
      setTimeout(scrollToNext, 150)
    }
  }

  function handleCardTap(card: FeedCard, isQuiz: boolean) {
    if (isQuiz && !revealed.has(card.cardId)) {
      setRevealed((prev) => new Set(prev).add(card.cardId))
      return
    }
    const now = Date.now()
    const last = lastTapRef.current[card.cardId] || 0
    lastTapRef.current[card.cardId] = now
    if (now - last < 400) markCard(card, 'mastered')
  }

  function resetToSetup() {
    setPhase('setup')
    setCards([])
  }

  if (checkingAuth || subjectsLoading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>
  }

  // ------------------------------------------------------------------ SETUP PHASE
  if (phase === 'setup') {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-10 space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center gap-3">
          <Link href="/dashboard"><Button variant="ghost" size="icon"><ChevronLeft className="h-5 w-5" /></Button></Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Flame className="h-6 w-6 text-orange-400" /> Study Feed
            </h1>
            <p className="text-sm text-muted-foreground">Pick at least one subject to start scrolling.</p>
          </div>
        </div>

        {profileStats.streakCount > 0 && (
          <div className="flex items-center gap-2 rounded-xl glass border border-orange-500/30 px-4 py-2 w-fit">
            <Flame className="h-4 w-4 text-orange-400" />
            <span className="text-sm font-bold">{profileStats.streakCount} day streak</span>
          </div>
        )}

        <div className="space-y-2">
          {subjects.map((s: any) => {
            const color = getSubjectColor(s.name)
            const isSelected = selectedSubjects.has(s.id)
            const isExpanded = expandedSubjects.has(s.id)
            const chapters = subjectMindmaps[s.id] || []
            const chosenChapters = selectedChapters[s.id]
            return (
              <div key={s.id} className={`rounded-2xl border transition-colors ${isSelected ? `${color.bg} ${color.border}` : 'glass border-white/10'}`}>
                <label className="flex items-center gap-3 p-4 cursor-pointer">
                  <input type="checkbox" checked={isSelected} onChange={() => toggleSubject(s.id)} className="h-4 w-4" />
                  <span className="flex-1 font-semibold">{s.name}</span>
                  {isSelected && chapters.length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); toggleExpanded(s.id) }}
                      className={`text-xs font-bold uppercase tracking-widest ${color.text} hover:underline`}
                    >
                      {chosenChapters ? `${chosenChapters.size}/${chapters.length} chapters` : 'chapters'}
                    </button>
                  )}
                  {isSelected && loadingChaptersFor === s.id && <Loader2 className="h-4 w-4 animate-spin" />}
                </label>
                {isSelected && isExpanded && chapters.length > 0 && (
                  <div className="px-4 pb-4 space-y-1.5 max-h-56 overflow-y-auto">
                    {chapters.map((c: any) => (
                      <label key={c.id} className="flex items-center gap-2.5 text-sm py-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={chosenChapters?.has(c.id) ?? true}
                          onChange={() => toggleChapter(s.id, c.id)}
                          className="h-3.5 w-3.5"
                        />
                        <span className="text-muted-foreground">{c.title}</span>
                      </label>
                    ))}
                  </div>
                )}
                {isSelected && !loadingChaptersFor && chapters.length === 0 && (
                  <p className="px-4 pb-4 text-xs text-muted-foreground">No mind maps generated for this subject yet.</p>
                )}
              </div>
            )
          })}
        </div>

        <Button
          onClick={handleStart}
          disabled={selectedSubjects.size === 0 || starting}
          className="w-full h-14 rounded-2xl text-base gap-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
        >
          {starting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Flame className="h-5 w-5" />}
          {starting ? "Loading your feed..." : "Start Studying"}
        </Button>
      </div>
    )
  }

  // ------------------------------------------------------------------ RECAP PHASE
  if (phase === 'recap') {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center p-8 text-center space-y-6 bg-gradient-to-b from-slate-900 to-black text-white">
        <Trophy className="h-16 w-16 text-amber-400" />
        <div>
          <h2 className="text-3xl font-black mb-2">Session complete!</h2>
          <p className="text-slate-400">You're caught up on what you picked. Great work.</p>
        </div>
        <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <p className="text-2xl font-bold">{sessionStats.reviewed}</p>
            <p className="text-[10px] uppercase tracking-widest text-slate-400">Reviewed</p>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <p className="text-2xl font-bold text-emerald-400">{sessionStats.mastered}</p>
            <p className="text-[10px] uppercase tracking-widest text-slate-400">Mastered</p>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <p className="text-2xl font-bold text-amber-400">+{sessionStats.xp}</p>
            <p className="text-[10px] uppercase tracking-widest text-slate-400">XP</p>
          </div>
        </div>
        {profileStats.streakCount > 0 && (
          <div className="flex items-center gap-2 rounded-full bg-orange-500/20 border border-orange-500/40 px-4 py-2">
            <Flame className="h-4 w-4 text-orange-400" />
            <span className="text-sm font-bold">{profileStats.streakCount} day streak</span>
          </div>
        )}
        <div className="flex gap-3 w-full max-w-sm pt-2">
          <Button onClick={handleStart} className="flex-1 h-12 gap-2 bg-gradient-to-r from-orange-500 to-pink-500">
            <RotateCcw className="h-4 w-4" /> Keep Going
          </Button>
          <Button onClick={resetToSetup} variant="outline" className="flex-1 h-12 border-white/20 text-white hover:bg-white/10">
            Change Subjects
          </Button>
        </div>
      </div>
    )
  }

  // ------------------------------------------------------------------ SESSION PHASE
  return (
    <div className="h-screen w-screen fixed inset-0 bg-black text-white select-none">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full w-full overflow-y-scroll"
        style={{ scrollSnapType: 'y mandatory', scrollBehavior: 'smooth' }}
      >
        {cards.map((card, index) => {
          const color = getSubjectColor(card.subjectName)
          const img = images[card.cardId]
          const isQuiz = index % 5 === 4 && !!(card.definition || card.mechanism)
          const isRevealed = !isQuiz || revealed.has(card.cardId)

          return (
            <div
              key={card.cardId}
              className="relative h-screen w-full flex flex-col justify-end overflow-hidden border-b border-white/5"
              style={{ scrollSnapAlign: 'start' }}
              onClick={() => handleCardTap(card, isQuiz)}
            >
              {img?.url ? (
                <img src={img.url} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className={`absolute inset-0 bg-black ${color.bgSolid}`} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />

              <div className="relative z-10 p-6 md:p-10 pb-24 space-y-4">
                <p className={`text-xs font-bold uppercase tracking-widest ${color.text}`}>{card.subjectName} · {card.chapterTitle}</p>
                <h2 className="text-3xl md:text-5xl font-black leading-tight drop-shadow-lg">{card.name}</h2>

                {isRevealed ? (
                  <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-1">
                    {card.definition && (
                      <div>
                        <h4 className="text-xs font-bold text-blue-400 mb-1 tracking-widest uppercase">Definition</h4>
                        <p className="text-lg md:text-xl font-medium leading-snug">{card.definition}</p>
                      </div>
                    )}
                    {card.mechanism && (
                      <div>
                        <h4 className="text-xs font-bold text-purple-400 mb-1 tracking-widest uppercase">Mechanism</h4>
                        <p className="text-lg md:text-xl font-medium leading-snug">{card.mechanism}</p>
                      </div>
                    )}
                    {card.examples && (
                      <div>
                        <h4 className="text-xs font-bold text-emerald-400 mb-1 tracking-widest uppercase">Examples</h4>
                        <p className="text-lg md:text-xl font-medium leading-snug">{card.examples}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setRevealed((prev) => new Set(prev).add(card.cardId)) }}
                    className="flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-5 py-3 text-sm font-bold"
                  >
                    <Eye className="h-4 w-4" /> Quick check - what do you remember? Tap to reveal.
                  </button>
                )}

                <div className="flex gap-3 pt-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => markCard(card, 'learning')}
                    className="flex-1 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 font-bold text-sm active:scale-95 transition-transform"
                  >
                    Still Learning
                  </button>
                  <button
                    onClick={() => markCard(card, 'mastered')}
                    className="flex-1 h-12 rounded-2xl bg-emerald-500 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    <Check className="h-4 w-4" /> Got It
                  </button>
                </div>

                {img?.photographer && (
                  <a href={img.photographerUrl} target="_blank" rel="noreferrer" className="block text-[10px] text-white/40 pt-1" onClick={(e) => e.stopPropagation()}>
                    Photo by {img.photographer} on Pexels
                  </a>
                )}
              </div>

              {heartPop === card.cardId && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <Check className="h-32 w-32 text-emerald-400 animate-ping" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Fixed overlay: back button, progress, streak */}
      <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex items-center justify-between pointer-events-none z-30">
        <button onClick={resetToSetup} className="pointer-events-auto h-10 w-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5">
            <Flame className="h-3.5 w-3.5 text-orange-400" />
            <span className="text-xs font-bold">{profileStats.streakCount}</span>
          </div>
          <div className="pointer-events-auto rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 text-xs font-bold">
            {Math.min(sessionStats.reviewed, DAILY_GOAL)}/{DAILY_GOAL} today
          </div>
        </div>
      </div>
    </div>
  )
}
