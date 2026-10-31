// Active study time per day, synced to the account so the streak follows the student across devices.
// A day counts toward the streak once the student has used the app for DAILY_GOAL_MIN minutes.
import { Firestore, doc, getDoc, increment, setDoc } from "firebase/firestore"
import { dayKey } from "@/lib/study"

export const DAILY_GOAL_MIN = 10
export const DAILY_GOAL_SEC = DAILY_GOAL_MIN * 60

export type Usage = { days?: Record<string, number> }

const usageRef = (db: Firestore, uid: string) => doc(db, "users", uid, "progress", "usage")

// Seconds counted on this device but not yet saved. Pages add this to what they loaded so the numbers stay live.
let pendingSec = 0
export const getPendingSeconds = () => pendingSec
export const bumpPending = (s: number) => { pendingSec += s }
export const takePending = () => { const p = pendingSec; pendingSec = 0; return p }

export async function loadUsage(db: Firestore, uid: string): Promise<Usage> {
  const s = await getDoc(usageRef(db, uid))
  return (s.exists() ? s.data() : {}) as Usage
}

/** Adds seconds of active time to today's total. */
export async function addActiveSeconds(db: Firestore, uid: string, seconds: number) {
  if (seconds <= 0) return
  await setDoc(usageRef(db, uid), { days: { [dayKey()]: increment(Math.round(seconds)) } }, { merge: true })
}

const secondsOn = (u: Usage | null | undefined, k: string) => (u?.days || {})[k] || 0
export const metGoal = (u: Usage | null | undefined, k: string) => secondsOn(u, k) >= DAILY_GOAL_SEC

export const todaySeconds = (u: Usage | null | undefined) => secondsOn(u, dayKey())
export const doneTodayUsage = (u: Usage | null | undefined) => metGoal(u, dayKey())

/** Consecutive days that met the goal, ending today (or yesterday if today is not finished yet, so the streak stays alive). */
export function usageStreak(u: Usage | null | undefined) {
  let n = 0
  const d = new Date()
  if (!metGoal(u, dayKey(d))) d.setDate(d.getDate() - 1)
  while (metGoal(u, dayKey(d))) { n++; d.setDate(d.getDate() - 1) }
  return n
}

/** Longest run of goal days on record. */
export function bestStreak(u: Usage | null | undefined) {
  const keys = Object.keys(u?.days || {}).filter((k) => metGoal(u, k)).sort()
  let best = 0, run = 0, prev: number | null = null
  for (const k of keys) {
    const [y, m, dd] = k.split("-").map(Number)
    const t = Date.UTC(y, m - 1, dd) / 86400000
    run = prev !== null && t - prev === 1 ? run + 1 : 1
    prev = t
    if (run > best) best = run
  }
  return best
}

export const totalMinutes = (u: Usage | null | undefined) =>
  Math.floor(Object.values(u?.days || {}).reduce((s, v) => s + (v || 0), 0) / 60)

/** Last n days, oldest first, with minutes studied and whether the goal was met. */
export function lastDays(u: Usage | null | undefined, n = 14) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (n - 1 - i))
    const k = dayKey(d)
    const sec = secondsOn(u, k)
    return { k, date: d, min: Math.floor(sec / 60), met: sec >= DAILY_GOAL_SEC }
  })
}

export type Reward = { days: number; emoji: string; title: string; note: string }

/** Streak milestones. Rewards are badges and titles that show on the streak page. */
export const REWARDS: Reward[] = [
  { days: 1, emoji: "🌱", title: "First Step", note: "Your first 10-minute day" },
  { days: 3, emoji: "🔥", title: "Warming Up", note: "3 days in a row" },
  { days: 7, emoji: "⚡", title: "Week Warrior", note: "A full week of showing up" },
  { days: 14, emoji: "🧠", title: "Habit Builder", note: "Two weeks strong" },
  { days: 30, emoji: "🏅", title: "Monthly Master", note: "30 days without a break" },
  { days: 60, emoji: "💎", title: "Diamond Focus", note: "60 days of consistency" },
  { days: 100, emoji: "👑", title: "Centurion", note: "100 days. Legendary" },
]

export function rewardState(streak: number) {
  const next = REWARDS.find((r) => r.days > streak) || null
  const prev = [...REWARDS].reverse().find((r) => r.days <= streak) || null
  return { next, prev }
}
