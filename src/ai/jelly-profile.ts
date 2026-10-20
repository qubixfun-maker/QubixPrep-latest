import { createHash } from 'crypto'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '@/lib/firebase-admin'
import { osceCall, parseJson } from '@/ai/osce-ai'
import { EMPTY_PROFILE, EXAMS, LANGS, YEARS, topicKey, type JellyProfile } from '@/lib/jelly/profile'

const db = () => getAdminFirestore()
const prof = (uid: string) => db().collection('jellyProfiles').doc(uid)

export type PlanName = 'admin' | 'pro' | 'basic' | 'free'
export async function planOf(uid: string): Promise<PlanName> {
  const u = (await db().collection('users').doc(uid).get()).data()
  if (u?.role === 'admin') return 'admin'
  return u?.plan === 'pro' ? 'pro' : u?.plan === 'basic' ? 'basic' : 'free'
}
/** Chats per day: 0 means unlimited, -1 means no access. */
export const limitFor = (p: PlanName) => (p === 'admin' ? 0 : p === 'pro' ? Number(process.env.JELLY_LIMIT_PRO) || 100 : p === 'basic' ? Number(process.env.JELLY_LIMIT_BASIC) || 30 : -1)

const today = () => new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10)

export async function getProfile(uid: string): Promise<JellyProfile> {
  const d = (await prof(uid).get()).data() as Partial<JellyProfile> | undefined
  return { ...EMPTY_PROFILE, ...(d || {}), notes: d?.notes || [], weak: d?.weak || {} }
}

const clean = (s: unknown, n: number) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n)

/** Saves only fields the student may set; everything is length-limited and validated. */
export async function saveProfile(uid: string, patch: any) {
  const out: Record<string, any> = {}
  if ('year' in patch) out.year = YEARS.includes(patch.year) ? patch.year : FieldValue.delete()
  if ('exam' in patch) out.exam = EXAMS.includes(patch.exam) ? patch.exam : FieldValue.delete()
  if ('examDate' in patch) out.examDate = /^\d{4}-\d{2}-\d{2}$/.test(patch.examDate || '') ? patch.examDate : FieldValue.delete()
  if ('language' in patch && LANGS.includes(patch.language)) out.language = patch.language
  if ('depth' in patch && ['brief', 'balanced', 'detailed'].includes(patch.depth)) out.depth = patch.depth
  if ('persona' in patch && ['jarvis', 'friend', 'teacher', 'examiner', 'mentor'].includes(patch.persona)) out.persona = patch.persona
  if ('voiceOn' in patch) out.voiceOn = !!patch.voiceOn
  if ('voiceKid' in patch) out.voiceKid = !!patch.voiceKid
  if ('voiceGender' in patch && ['female', 'male'].includes(patch.voiceGender)) out.voiceGender = patch.voiceGender
  if (Array.isArray(patch.notes)) out.notes = patch.notes.map((n: unknown) => clean(n, 140)).filter(Boolean).slice(0, 12)
  if (Object.keys(out).length) await prof(uid).set(out, { merge: true })
}

export async function trackAnswers(uid: string, items: { topic: string; correct: boolean }[]) {
  const weak: Record<string, any> = {}
  for (const it of items.slice(0, 30)) {
    const label = clean(it.topic, 60)
    const key = topicKey(label)
    if (!key) continue
    const cur = weak[key] || { label, w: 0, t: 0 }
    cur.t += 1; if (!it.correct) cur.w += 1
    weak[key] = cur
  }
  const upd: Record<string, any> = {}
  for (const [k, v] of Object.entries(weak)) {
    upd[k] = { label: v.label, w: FieldValue.increment(v.w), t: FieldValue.increment(v.t) }
  }
  if (Object.keys(upd).length) await prof(uid).set({ weak: upd }, { merge: true })
}

export async function forgetAll(uid: string) { await prof(uid).delete() }

export async function usageToday(uid: string): Promise<number> {
  const d = (await db().collection('jellyUsage').doc(`${uid}_${today()}`).get()).data()
  return Number(d?.n) || 0
}

/** Counts one AI chat; throws when the daily limit is used up. */
export async function bumpUsage(uid: string, limit: number) {
  if (limit <= 0) return
  const ref = db().collection('jellyUsage').doc(`${uid}_${today()}`)
  await db().runTransaction(async (tx) => {
    const n = Number((await tx.get(ref)).data()?.n) || 0
    if (n >= limit) throw new Error(`You have used all ${limit} Jelly chats for today. They reset at midnight.`)
    tx.set(ref, { n: n + 1, uid, t: Date.now() })
  })
}

export async function saveFeedback(uid: string, f: { rating: string; q: string; a: string; persona: string }) {
  const id = createHash('sha1').update(`${uid}|${f.q}|${f.a}`).digest('hex').slice(0, 24)
  await db().collection('jellyFeedback').doc(id).set({ uid, rating: f.rating === 'down' ? 'down' : 'up', q: clean(f.q, 600), a: clean(f.a, 1200), persona: clean(f.persona, 20), t: Date.now() })
}

const WORTH = /\b(i am|i'm|im|my|i have|i want|i need|remember|exam|year|prefer|weak|struggle|schedule|prepar|focus|plan)\b/i

/** Picks up study-related facts the student mentions (year, exam, preferences). Never stores personal details. */
export async function learnFromChat(uid: string, text: string) {
  const t = clean(text, 400)
  if (t.length < 12 || !WORTH.test(t)) return
  const { content } = await osceCall([{ role: 'user', content:
`A medical student wrote this to their study assistant: "${t}"
Extract ONLY durable study-related facts: year of study, target exam and date, subjects or topics they find hard or want to focus on, how they like things explained, their study schedule. Never extract health, family, relationships, money, religion, location or any other personal detail.
Return ONLY JSON: {"facts":["short fact"],"year":null,"exam":null,"examDate":null}
"year" must be one of ${JSON.stringify(YEARS)} or null. "exam" must be one of ${JSON.stringify(EXAMS)} or null. "examDate" is YYYY-MM-DD or null. If nothing qualifies return {"facts":[],"year":null,"exam":null,"examDate":null}.` }], 250, 0, 'fast', true)
  const j = parseJson(content)
  if (!j) return
  const cur = await getProfile(uid)
  const facts: string[] = Array.isArray(j.facts) ? j.facts.map((f: unknown) => clean(f, 140)).filter(Boolean) : []
  const notes = [...cur.notes]
  for (const f of facts) if (!notes.some((n) => n.toLowerCase() === f.toLowerCase())) notes.push(f)
  const patch: any = { notes: notes.slice(-12) }
  if (YEARS.includes(j.year)) patch.year = j.year
  if (EXAMS.includes(j.exam)) patch.exam = j.exam
  if (/^\d{4}-\d{2}-\d{2}$/.test(j.examDate || '')) patch.examDate = j.examDate
  if (facts.length || patch.year || patch.exam || patch.examDate) await saveProfile(uid, patch)
}
