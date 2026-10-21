"use client"
// Small helper: calls an Arena API action with the signed-in user's token.
let skew = 0
/** Server-corrected clock, so countdowns match on every device. */
export const nowMs = () => Date.now() + skew

export async function arena(user: any, action: string, body: Record<string, any> = {}) {
  const idToken = await user.getIdToken()
  const res = await fetch(`/api/arena/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, idToken }) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || "Something went wrong")
  if (typeof data.serverNow === "number") skew = data.serverNow - Date.now()
  return data
}

export const BADGES: Record<string, { emoji: string; name: string; hint: string }> = {
  first: { emoji: "🎮", name: "First Match", hint: "Play your first arena game" },
  win1: { emoji: "🏆", name: "First Win", hint: "Win a live duel" },
  win10: { emoji: "👑", name: "Duel Master", hint: "Win 10 duels" },
  streak5: { emoji: "🔥", name: "On Fire", hint: "Get 5 correct in a row" },
  played25: { emoji: "💪", name: "Regular", hint: "Play 25 games" },
  coop3: { emoji: "🤝", name: "Team Doctor", hint: "Finish 3 co-op Ward Rounds" },
  ward5: { emoji: "🩺", name: "Ward Walker", hint: "Clear 5 Ward Round cases" },
  xp1000: { emoji: "⭐", name: "1000 Club", hint: "Earn 1000 XP" },
}

export function earnedBadges(me: any): string[] {
  if (!me) return []
  const out: string[] = []
  if (me.played >= 1) out.push("first")
  if (me.wins >= 1) out.push("win1")
  if (me.wins >= 10) out.push("win10")
  if (me.bestStreak >= 5) out.push("streak5")
  if (me.played >= 25) out.push("played25")
  if (me.coop >= 3) out.push("coop3")
  if (me.wardDone >= 5) out.push("ward5")
  if (me.xp >= 1000) out.push("xp1000")
  return out
}

export function seasonBadge(id: string) {
  const m = /^season-(\d+)-(gold|silver|bronze)$/.exec(id)
  if (!m) return null
  const medal = { gold: "🥇", silver: "🥈", bronze: "🥉" }[m[2] as "gold"]
  return { emoji: medal, name: `Season ${Number(m[1]) + 1} ${m[2]}`, hint: "Top 3 of a season" }
}
