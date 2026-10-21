// Server-side helpers for the Arena (multiplayer). Everything that matters
// (scoring, answers, XP) is decided here with the Admin SDK so players can't cheat.
import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/firebase-admin'
import type { Firestore } from 'firebase-admin/firestore'

export const SEC_PER_Q = 20
export const REVEAL_MS = 3500
export const COUNTDOWN_MS = 3000
const EPOCH = Date.UTC(2026, 0, 5)
const SEASON_MS = 28 * 864e5

export class HttpError extends Error {
  status: number
  constructor(status: number, msg: string) { super(msg); this.status = status }
}
export const fail = (e: any) => NextResponse.json({ error: e?.message || 'Failed' }, { status: e?.status || 500 })

export function seasonOf(now = Date.now()) {
  const id = Math.floor((now - EPOCH) / SEASON_MS)
  return { id, number: id + 1, start: EPOCH + id * SEASON_MS, end: EPOCH + (id + 1) * SEASON_MS }
}

export async function authBody(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  if (!body?.idToken) throw new HttpError(400, 'Missing idToken')
  const d = await verifyIdToken(body.idToken)
  const name = String(d.name || (d.email || '').split('@')[0] || 'Student').slice(0, 24)
  return { uid: d.uid, name, body }
}

export function shuffle<T>(a: T[]): T[] {
  const r = a.slice()
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]] }
  return r
}

const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export async function uniqueCode(db: Firestore) {
  for (let i = 0; i < 8; i++) {
    const code = Array.from({ length: 6 }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join('')
    if (!(await db.collection('rooms').doc(code).get()).exists) return code
  }
  throw new HttpError(500, 'Could not make a room code, try again')
}

/** Applies XP / counters to a player's stats doc, rolling the season over when needed. */
export function applyStats(prev: any, name: string, d: { xp: number; played?: number; wins?: number; coop?: number; bestStreak?: number }) {
  const s = seasonOf()
  const p = prev || {}
  let seasonXp = p.seasonXp || 0
  let last = p.lastSeason ?? null
  if (p.seasonId !== undefined && p.seasonId !== s.id) { last = { id: p.seasonId, xp: p.seasonXp || 0 }; seasonXp = 0 }
  return {
    ...p, name,
    xp: (p.xp || 0) + d.xp,
    seasonId: s.id, seasonXp: seasonXp + d.xp, lastSeason: last,
    played: (p.played || 0) + (d.played || 0),
    wins: (p.wins || 0) + (d.wins || 0),
    coop: (p.coop || 0) + (d.coop || 0),
    bestStreak: Math.max(p.bestStreak || 0, d.bestStreak || 0),
    updatedAt: Date.now(),
  }
}

export type Built = { pub: any[]; answers: number[]; explanations: string[]; label: string }

/** Builds a question set (without answers in `pub`) from QBank or flashcards. */
export async function buildQuestions(db: Firestore, src: { type: string; subjectId: string }, n: number): Promise<Built> {
  const subj = await db.collection('subjects').doc(src.subjectId).get()
  const subjName = (subj.data() as any)?.name || 'Subject'
  if (src.type === 'flashcards') {
    const snap = await db.collection('subjects').doc(src.subjectId).collection('flashcardDecks').get()
    const cards: { front: string; back: string }[] = []
    snap.docs.forEach((d) => ((d.data() as any).cards || []).forEach((c: any) => {
      if (typeof c?.front === 'string' && typeof c?.back === 'string' && c.front.trim() && c.back.trim()) cards.push({ front: c.front.trim(), back: c.back.trim() })
    }))
    const backs = Array.from(new Set(cards.map((c) => c.back.slice(0, 120))))
    if (cards.length < 5 || backs.length < 4) throw new HttpError(400, 'Not enough flashcards in this subject yet')
    const pick = shuffle(cards).slice(0, n)
    const pub: any[] = [], answers: number[] = [], explanations: string[] = []
    pick.forEach((c, i) => {
      const right = c.back.slice(0, 120)
      const wrong = shuffle(backs.filter((b) => b !== right)).slice(0, 3)
      const opts = shuffle([right, ...wrong])
      pub.push({ id: 'f' + i, q: c.front.slice(0, 300), options: opts, topic: subjName })
      answers.push(opts.indexOf(right)); explanations.push(c.back)
    })
    return { pub, answers, explanations, label: subjName + ' flashcards' }
  }
  const snap = await db.collection('subjects').doc(src.subjectId).collection('qbankQuestions').get()
  const rows: any[] = []
  snap.docs.forEach((d) => {
    const x = d.data() as any
    const opts = [x.option1, x.option2, x.option3, x.option4]
    const filled = opts.filter((o) => o != null && String(o).trim() !== '')
    const holes = filled.length !== (opts.map((o, i) => (o != null && String(o).trim() !== '' ? i + 1 : 0)).reduce((a, b) => Math.max(a, b), 0))
    if (!x.question_text || filled.length < 2 || holes) return
    if (!Number.isInteger(x.correct_answer_index) || x.correct_answer_index < 0 || x.correct_answer_index >= filled.length) return
    rows.push({ id: d.id, q: String(x.question_text).slice(0, 600), options: filled.map(String), a: x.correct_answer_index, e: x.explanation || '', topic: x.topic_title || subjName })
  })
  if (rows.length < 5) throw new HttpError(400, 'Not enough questions in this subject yet')
  const pick = shuffle(rows).slice(0, n)
  return {
    pub: pick.map((r) => ({ id: r.id, q: r.q, options: r.options, topic: r.topic })),
    answers: pick.map((r) => r.a), explanations: pick.map((r) => String(r.e).slice(0, 500)),
    label: subjName + ' QBank',
  }
}
