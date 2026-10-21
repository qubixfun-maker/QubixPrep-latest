export const dynamic = "force-dynamic"
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import {
  HttpError, fail, authBody, uniqueCode, buildQuestions, applyStats, seasonOf,
  SEC_PER_Q, REVEAL_MS, COUNTDOWN_MS,
} from '@/lib/arena'

const DELTA: Record<string, number> = { optimal: 6, acceptable: -4, wrong: -12, unsafe: -28 }
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n))
const newPlayer = (name: string, extra: any = {}) => ({ name, score: 0, correct: 0, streak: 0, bestStreak: 0, idx: 0, qStart: null, finished: false, joinedAt: Date.now(), ...extra })

export async function POST(req: NextRequest, { params }: { params: Promise<{ action: string }> }) {
  try {
    const { action } = await params
    const u = await authBody(req)
    const db = getAdminFirestore()
    let out: any
    switch (action) {
      case 'create': out = await create(db, u); break
      case 'join': out = await join(db, u); break
      case 'start': out = await start(db, u); break
      case 'answer': out = await answer(db, u); break
      case 'tick': out = await tick(db, u); break
      case 'coop': out = await coop(db, u); break
      case 'xp': out = await wardXp(db, u); break
      case 'leaderboard': out = await leaderboard(db, u); break
      default: throw new HttpError(404, 'Unknown action')
    }
    return NextResponse.json({ ...out, serverNow: Date.now() })
  } catch (e) { return fail(e) }
}

type U = { uid: string; name: string; body: any }

/* ------------------------------------------------------------------ create */
async function create(db: FirebaseFirestore.Firestore, u: U) {
  const b = u.body
  const kind = b.kind === 'coop' ? 'coop' : 'duel'
  const mode = kind === 'duel' && b.mode === 'async' ? 'async' : 'live'
  const code = await uniqueCode(db)
  const now = Date.now()
  const room: any = {
    code, kind, mode, status: mode === 'async' ? 'open' : 'lobby', hostUid: u.uid, hostName: u.name,
    createdAt: now, expiresAt: now + 24 * 3600e3, order: [u.uid],
    players: { [u.uid]: newPlayer(u.name, mode === 'async' ? { qStart: now } : {}) },
  }
  let secret: any = {}
  if (kind === 'duel') {
    const type = b.source?.type === 'flashcards' ? 'flashcards' : 'qbank'
    const subjectId = String(b.source?.subjectId || '')
    if (!subjectId) throw new HttpError(400, 'Pick a subject')
    const n = clamp(parseInt(b.qCount) || 10, 5, 20)
    const built = await buildQuestions(db, { type, subjectId }, n)
    room.questions = built.pub; room.qCount = built.pub.length; room.sec = SEC_PER_Q
    room.source = { type, subjectId, label: built.label }; room.cur = null
    secret = { answers: built.answers, explanations: built.explanations, picks: {} }
  } else {
    let caseId = String(b.caseId || '')
    if (!caseId) {
      const snap = await db.collection('cases').select('specialty').get()
      let ids = snap.docs.filter((d) => !b.specialty || (d.data() as any).specialty === b.specialty).map((d) => d.id)
      if (!ids.length) ids = snap.docs.map((d) => d.id)
      if (!ids.length) throw new HttpError(400, 'No cases yet')
      caseId = ids[Math.floor(Math.random() * ids.length)]
    }
    const c = await db.collection('cases').doc(caseId).get()
    if (!c.exists) throw new HttpError(404, 'Case not found')
    room.caseId = caseId; room.caseTitle = (c.data() as any).title || 'Patient'; room.qCount = 5
    room.coop = { stage: 0, phase: 'vote', votes: {}, stability: 100, score: 0, max: 0, history: [], result: null, final: null }
  }
  const batch = db.batch()
  batch.set(db.collection('rooms').doc(code), room)
  batch.set(db.collection('roomSecrets').doc(code), secret)
  await batch.commit()
  return { code, kind, mode }
}

/* -------------------------------------------------------------------- join */
async function join(db: FirebaseFirestore.Firestore, u: U) {
  const code = String(u.body.code || '').toUpperCase().trim()
  if (!code) throw new HttpError(400, 'Enter a room code')
  const ref = db.collection('rooms').doc(code)
  return db.runTransaction(async (tx) => {
    const s = await tx.get(ref)
    if (!s.exists) throw new HttpError(404, 'Room not found. Check the code.')
    const room = s.data() as any
    if (room.players[u.uid]) return { ok: true, kind: room.kind, mode: room.mode }
    const n = room.order.length
    if (room.mode === 'async') {
      if (Date.now() > room.expiresAt) throw new HttpError(410, 'This challenge has expired')
      if (n >= 60) throw new HttpError(400, 'This challenge is full')
    } else {
      if (room.status !== 'lobby') throw new HttpError(400, 'This game has already started')
      if (n >= (room.kind === 'coop' ? 4 : 6)) throw new HttpError(400, 'Room is full')
    }
    tx.update(ref, {
      ['players.' + u.uid]: newPlayer(u.name, room.mode === 'async' ? { qStart: Date.now() } : {}),
      order: [...room.order, u.uid],
    })
    return { ok: true, kind: room.kind, mode: room.mode }
  })
}

/* ------------------------------------------------------------------- start */
async function start(db: FirebaseFirestore.Firestore, u: U) {
  const ref = db.collection('rooms').doc(String(u.body.code || '').toUpperCase())
  return db.runTransaction(async (tx) => {
    const s = await tx.get(ref)
    if (!s.exists) throw new HttpError(404, 'Room not found')
    const room = s.data() as any
    if (room.hostUid !== u.uid) throw new HttpError(403, 'Only the host can start')
    if (room.mode === 'async' || room.status !== 'lobby') return { ok: true }
    const patch: any = { status: 'playing' }
    if (room.kind === 'duel') patch.cur = { idx: 0, phase: 'q', startedAt: Date.now() + COUNTDOWN_MS }
    tx.update(ref, patch)
    return { ok: true }
  })
}

/* ------------------------------------------------------------------ answer */
async function answer(db: FirebaseFirestore.Firestore, u: U) {
  const code = String(u.body.code || '').toUpperCase()
  const idx = Number(u.body.idx), choice = Number(u.body.choice)
  if (!Number.isInteger(idx) || !Number.isInteger(choice)) throw new HttpError(400, 'Bad answer')
  const rref = db.collection('rooms').doc(code), sref = db.collection('roomSecrets').doc(code), stref = db.collection('arenaStats').doc(u.uid)
  return db.runTransaction(async (tx) => {
    const [rs, ss, sts] = await Promise.all([tx.get(rref), tx.get(sref), tx.get(stref)])
    if (!rs.exists || !ss.exists) throw new HttpError(404, 'Room not found')
    const room = rs.data() as any, sec = ss.data() as any
    const me = room.players[u.uid]
    if (room.kind !== 'duel' || !me) throw new HttpError(403, 'Not in this room')
    if (idx < 0 || idx >= room.qCount) throw new HttpError(400, 'Bad question')
    const now = Date.now()
    let elapsed = 0
    if (room.mode === 'live') {
      const cur = room.cur
      if (room.status !== 'playing' || !cur || cur.phase !== 'q' || cur.idx !== idx) throw new HttpError(409, 'That question is closed')
      if (now > cur.startedAt + room.sec * 1000 + 1500) throw new HttpError(409, 'Time is up')
      if (sec.picks?.[idx]?.[u.uid] !== undefined) throw new HttpError(409, 'Already answered')
      elapsed = Math.max(0, now - cur.startedAt)
    } else {
      if (me.finished || me.idx !== idx || !me.qStart) throw new HttpError(409, 'Out of sync, reload the page')
      elapsed = Math.max(0, now - me.qStart)
    }
    const correctIndex = sec.answers[idx]
    const right = choice === correctIndex
    const streak = right ? (me.streak || 0) + 1 : 0
    const pts = right ? 100 + Math.round(100 * Math.max(0, 1 - elapsed / (room.sec * 1000))) + Math.min(50, (streak - 1) * 10) : 0
    const upd: any = {
      ['players.' + u.uid + '.score']: (me.score || 0) + pts,
      ['players.' + u.uid + '.correct']: (me.correct || 0) + (right ? 1 : 0),
      ['players.' + u.uid + '.streak']: streak,
      ['players.' + u.uid + '.bestStreak']: Math.max(me.bestStreak || 0, streak),
    }
    let finished = false
    if (room.mode === 'live') {
      const picksIdx = { ...(sec.picks?.[idx] || {}), [u.uid]: choice }
      tx.update(sref, { ['picks.' + idx + '.' + u.uid]: choice })
      if (Object.keys(picksIdx).length >= room.order.length) {
        upd.cur = { idx, phase: 'reveal', startedAt: room.cur.startedAt, revealAt: now, correct: correctIndex, explanation: sec.explanations[idx] || '', picks: picksIdx }
      }
    } else {
      finished = idx + 1 >= room.qCount
      upd['players.' + u.uid + '.idx'] = idx + 1
      upd['players.' + u.uid + '.qStart'] = now + 1500
      if (finished) {
        upd['players.' + u.uid + '.finished'] = true
        const totalCorrect = (me.correct || 0) + (right ? 1 : 0)
        const newBest = Math.max(me.bestStreak || 0, streak)
        tx.set(stref, applyStats(sts.exists ? sts.data() : null, u.name, { xp: totalCorrect * 5 + 10, played: 1, bestStreak: newBest }))
      }
    }
    tx.update(rref, upd)
    return { ok: true, correct: right, correctIndex, explanation: sec.explanations[idx] || '', points: pts, finished }
  })
}

/* -------------------------------------------------------------------- tick */
// Anyone in the room may call this; it only does something when the timer says it should (idempotent).
async function tick(db: FirebaseFirestore.Firestore, u: U) {
  const code = String(u.body.code || '').toUpperCase()
  const rref = db.collection('rooms').doc(code), sref = db.collection('roomSecrets').doc(code)
  return db.runTransaction(async (tx) => {
    const [rs, ss] = await Promise.all([tx.get(rref), tx.get(sref)])
    if (!rs.exists || !ss.exists) return { ok: true }
    const room = rs.data() as any, sec = ss.data() as any
    if (!room.players[u.uid] || room.kind !== 'duel' || room.mode !== 'live' || room.status !== 'playing' || !room.cur) return { ok: true }
    const now = Date.now(), cur = room.cur
    if (cur.phase === 'q') {
      if (now > cur.startedAt + room.sec * 1000 + 500) {
        tx.update(rref, { cur: { idx: cur.idx, phase: 'reveal', startedAt: cur.startedAt, revealAt: now, correct: sec.answers[cur.idx], explanation: sec.explanations[cur.idx] || '', picks: sec.picks?.[cur.idx] || {} } })
      }
      return { ok: true }
    }
    if (now < cur.revealAt + REVEAL_MS) return { ok: true }
    if (cur.idx + 1 < room.qCount) {
      tx.update(rref, { cur: { idx: cur.idx + 1, phase: 'q', startedAt: now } })
      return { ok: true }
    }
    // game over -> award XP to everyone, once
    const ids: string[] = room.order
    const refs = ids.map((id) => db.collection('arenaStats').doc(id))
    const docs = await tx.getAll(...refs)
    const ranked = ids.slice().sort((a, b) => (room.players[b].score || 0) - (room.players[a].score || 0))
    ids.forEach((id, i) => {
      const p = room.players[id], place = ranked.indexOf(id), n = ids.length
      const win = n > 1 && place === 0 && (p.score || 0) > 0
      const xp = (p.correct || 0) * 5 + 10 + (win ? 30 : n > 2 && place === 1 ? 15 : 0)
      tx.set(refs[i], applyStats(docs[i].exists ? docs[i].data() : null, p.name, { xp, played: 1, wins: win ? 1 : 0, bestStreak: p.bestStreak || 0 }))
    })
    tx.update(rref, { status: 'finished', finishedAt: now, cur: { ...cur, phase: 'done' } })
    return { ok: true }
  })
}

/* -------------------------------------------------------------------- coop */
async function coop(db: FirebaseFirestore.Firestore, u: U) {
  const code = String(u.body.code || '').toUpperCase()
  const op = String(u.body.op || '')
  const rref = db.collection('rooms').doc(code)
  return db.runTransaction(async (tx) => {
    const rs = await tx.get(rref)
    if (!rs.exists) throw new HttpError(404, 'Room not found')
    const room = rs.data() as any
    if (room.kind !== 'coop' || !room.players[u.uid]) throw new HttpError(403, 'Not in this room')
    if (room.status !== 'playing') throw new HttpError(409, 'Not playing')
    const cs = await tx.get(db.collection('cases').doc(room.caseId))
    const c = cs.data() as any
    const stages = (c?.stages || []).filter((s: any) => s.kind !== 'sequence')
    const co = room.coop
    const stage = stages[co.stage]
    if (!stage) throw new HttpError(500, 'Case is broken')

    const resolve = (votes: Record<string, string>) => {
      const lead = room.order[co.stage % room.order.length]
      const tally: Record<string, number> = {}
      Object.entries(votes).forEach(([uid, optId]) => { tally[optId] = (tally[optId] || 0) + (uid === lead ? 1.5 : 1) })
      const max = Math.max(...Object.values(tally))
      const tops = stage.options.filter((o: any) => tally[o.id] === max)
      const pick = tops.find((o: any) => o.id === votes[lead]) || tops[0]
      const best = stage.options.find((o: any) => o.outcome === 'optimal') || pick
      const stability = clamp(co.stability + (DELTA[pick.outcome] ?? 0), 0, 100)
      const result = { optId: pick.id, label: pick.label, outcome: pick.outcome, points: pick.points, feedback: pick.feedback || '', finding: pick.finding || '', bestId: best.id, bestLabel: best.label, bestFeedback: best.feedback || '', votes }
      tx.update(rref, {
        'coop.phase': 'reveal', 'coop.result': result, 'coop.stability': stability,
        'coop.score': co.score + (pick.points || 0), 'coop.max': co.max + Math.max(...stage.options.map((o: any) => o.points || 0)),
        'coop.history': [...co.history, { type: stage.type, outcome: pick.outcome, points: pick.points || 0 }],
      })
    }

    if (op === 'vote') {
      if (co.phase !== 'vote') throw new HttpError(409, 'Voting is closed')
      const optId = String(u.body.optId || '')
      if (!stage.options.some((o: any) => o.id === optId)) throw new HttpError(400, 'Bad option')
      const votes = { ...co.votes, [u.uid]: optId }
      if (Object.keys(votes).length >= room.order.length) resolve(votes)
      else tx.update(rref, { ['coop.votes.' + u.uid]: optId })
      return { ok: true }
    }
    if (op === 'lock') {
      if (room.hostUid !== u.uid) throw new HttpError(403, 'Only the host can lock in')
      if (co.phase !== 'vote' || Object.keys(co.votes).length < 1) throw new HttpError(409, 'Nobody has voted yet')
      resolve(co.votes)
      return { ok: true }
    }
    if (op === 'next') {
      if (co.phase !== 'reveal') return { ok: true }
      const over = co.stability <= 0 || co.stage + 1 >= stages.length
      if (!over) {
        tx.update(rref, { 'coop.stage': co.stage + 1, 'coop.phase': 'vote', 'coop.votes': {}, 'coop.result': null })
        return { ok: true }
      }
      const arrested = co.stability <= 0
      const percent = co.max > 0 ? Math.max(0, Math.round((co.score / co.max) * 100)) : 0
      const stars = arrested ? 0 : percent >= 85 ? 3 : percent >= 60 ? 2 : percent >= 35 ? 1 : 0
      const ids: string[] = room.order
      const refs = ids.map((id) => db.collection('arenaStats').doc(id))
      const docs = await tx.getAll(...refs)
      ids.forEach((id, i) => {
        const xp = stars * 20 + Math.max(0, Math.round(co.score / 2)) + 10
        tx.set(refs[i], applyStats(docs[i].exists ? docs[i].data() : null, room.players[id].name, { xp, played: 1, coop: 1 }))
      })
      tx.update(rref, { status: 'finished', finishedAt: Date.now(), 'coop.final': { percent, stars, arrested } })
      return { ok: true }
    }
    throw new HttpError(400, 'Unknown op')
  })
}

/* ---------------------------------------------------------------- ward xp */
async function wardXp(db: FirebaseFirestore.Firestore, u: U) {
  const caseId = String(u.body.caseId || '')
  const percent = clamp(Math.round(Number(u.body.percent) || 0), 0, 100)
  if (!caseId) throw new HttpError(400, 'Missing caseId')
  const ref = db.collection('arenaStats').doc(u.uid)
  return db.runTransaction(async (tx) => {
    const s = await tx.get(ref)
    const prev: any = s.exists ? s.data() : {}
    const done = prev.wardDone || {}
    const before = done[caseId]
    const gain = before === undefined ? 20 + Math.round(percent * 0.4) : Math.round(Math.max(0, percent - before) * 0.4)
    if (gain <= 0) return { ok: true, gain: 0 }
    const next: any = applyStats(prev, u.name, { xp: gain })
    next.wardDone = { ...done, [caseId]: Math.max(before ?? 0, percent) }
    tx.set(ref, next)
    return { ok: true, gain }
  })
}

/* ------------------------------------------------------------ leaderboard */
const pubRow = (id: string, d: any, xp: number) => ({ uid: id, name: d.name || 'Student', xp, wins: d.wins || 0, played: d.played || 0, badges: (d.badges || []).length })

async function leaderboard(db: FirebaseFirestore.Firestore, u: U) {
  const season = seasonOf()
  // Lazily give last season's top 3 their badges (the marker doc makes this run exactly once).
  if (season.id > 0) {
    const prev = season.id - 1
    const marker = db.collection('arenaMeta').doc('season-' + prev)
    if (!(await marker.get()).exists) {
      try {
        await marker.create({ at: Date.now() })
        const [a, b] = await Promise.all([
          db.collection('arenaStats').where('seasonId', '==', prev).get(),
          db.collection('arenaStats').where('lastSeason.id', '==', prev).get(),
        ])
        const rows: { id: string; xp: number }[] = []
        a.docs.forEach((d) => rows.push({ id: d.id, xp: (d.data() as any).seasonXp || 0 }))
        b.docs.forEach((d) => rows.push({ id: d.id, xp: (d.data() as any).lastSeason?.xp || 0 }))
        rows.filter((r) => r.xp > 0).sort((x, y) => y.xp - x.xp).slice(0, 3).forEach((r, i) => {
          const badge = `season-${prev}-${['gold', 'silver', 'bronze'][i]}`
          db.collection('arenaStats').doc(r.id).set({ badges: FieldValue.arrayUnion(badge) }, { merge: true })
        })
      } catch { /* someone else won the race */ }
    }
  }
  const [seasonSnap, allSnap, meSnap] = await Promise.all([
    db.collection('arenaStats').where('seasonId', '==', season.id).get(),
    db.collection('arenaStats').orderBy('xp', 'desc').limit(50).get(),
    db.collection('arenaStats').doc(u.uid).get(),
  ])
  const seasonRows = seasonSnap.docs.map((d) => pubRow(d.id, d.data(), (d.data() as any).seasonXp || 0)).filter((r) => r.xp > 0).sort((a, b) => b.xp - a.xp)
  const allRows = allSnap.docs.map((d) => pubRow(d.id, d.data(), (d.data() as any).xp || 0))
  const me: any = meSnap.exists ? meSnap.data() : null
  return {
    season: { id: season.id, number: season.number, start: season.start, end: season.end },
    seasonTop: seasonRows.slice(0, 50), allTop: allRows,
    me: me ? {
      xp: me.xp || 0, seasonXp: me.seasonId === season.id ? me.seasonXp || 0 : 0, played: me.played || 0, wins: me.wins || 0, coop: me.coop || 0,
      bestStreak: me.bestStreak || 0, badges: me.badges || [], wardDone: Object.keys(me.wardDone || {}).length,
      seasonRank: seasonRows.findIndex((r) => r.uid === u.uid) + 1,
    } : null,
  }
}
