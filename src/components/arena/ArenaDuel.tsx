"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, Trophy, Swords, Timer, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { arena, nowMs } from "@/lib/arena-client"
import { Avatar, Scoreboard, ShareBar, useClock } from "@/components/arena/arena-bits"

type Props = { room: any; user: any; code: string }
const REVEAL_MS = 3500

export function ArenaDuel({ room, user, code }: Props) {
  const me = room.players[user.uid]
  const isHost = room.hostUid === user.uid
  const [err, setErr] = useState("")
  const [busy, setBusy] = useState(false)
  const call = async (action: string, body: any = {}) => {
    setErr("")
    try { return await arena(user, action, { code, ...body }) } catch (e: any) { setErr(e.message); return null }
  }

  if (room.mode === "async") return <AsyncRun room={room} user={user} code={code} me={me} call={call} err={err} />

  /* ---------------- live ---------------- */
  if (room.status === "lobby") {
    return (
      <div className="space-y-5">
        <div className="rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-500 p-6 text-white shadow-xl">
          <p className="text-xs font-black uppercase tracking-widest opacity-80">{room.source?.type === "flashcards" ? "Flashcard Battle" : "QBank Duel"} · {room.qCount} questions</p>
          <h2 className="mt-1 text-2xl font-black">{room.source?.label}</h2>
          <p className="mt-1 text-sm opacity-90">{room.sec}s per question. Faster correct answers score more, and streaks add bonus points.</p>
        </div>
        <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Invite friends</p>
          <ShareBar code={code} label={`${room.hostName} is challenging you to a ${room.source?.label} duel!`} />
        </div>
        <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Players ({room.order.length}/6)</p>
          <div className="flex flex-wrap gap-3">
            {room.order.map((id: string, i: number) => (
              <div key={id} className="flex items-center gap-2 rounded-2xl border border-black/5 bg-slate-50 py-1.5 pl-1.5 pr-4">
                <Avatar name={room.players[id].name} i={i} /><span className="text-sm font-extrabold">{room.players[id].name}{id === room.hostUid ? " 👑" : ""}</span>
              </div>
            ))}
          </div>
        </div>
        {isHost ? (
          <Button disabled={busy} onClick={async () => { setBusy(true); await call("start"); setBusy(false) }} className="h-14 w-full rounded-2xl text-base font-black">
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Swords className="mr-2 h-5 w-5" /> Start the duel{room.order.length < 2 ? " (practice solo)" : ""}</>}
          </Button>
        ) : <p className="rounded-2xl bg-amber-50 p-4 text-center text-sm font-bold text-amber-800">Waiting for {room.hostName} to start…</p>}
        {err && <p className="text-center text-sm font-bold text-rose-600">{err}</p>}
      </div>
    )
  }

  if (room.status === "finished") return <Finished room={room} user={user} />
  return <LiveQuestion room={room} user={user} code={code} call={call} err={err} />
}

/* ---------------------------------------------------------------- live question */
function LiveQuestion({ room, user, code, call, err }: any) {
  const now = useClock(200)
  const cur = room.cur
  const q = room.questions[cur?.idx ?? 0]
  const [picked, setPicked] = useState<{ idx: number; choice: number } | null>(null)
  const tickAt = useRef(0)

  const reveal = cur?.phase === "reveal"
  const startsIn = cur ? cur.startedAt - now : 0
  const elapsed = cur ? now - cur.startedAt : 0
  const left = Math.max(0, room.sec - elapsed / 1000)
  const myPick = picked && picked.idx === cur.idx ? picked.choice : reveal ? cur.picks?.[user.uid] : undefined

  // anyone's browser can nudge the server forward when a timer runs out
  useEffect(() => {
    if (!cur) return
    const due = reveal ? cur.revealAt + REVEAL_MS : cur.startedAt + room.sec * 1000 + 500
    if (now > due && now - tickAt.current > 900) { tickAt.current = now; call("tick") }
  }, [now, cur, reveal, room.sec]) // eslint-disable-line

  if (!cur || !q) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  const choose = async (i: number) => {
    if (reveal || myPick !== undefined || startsIn > 0) return
    setPicked({ idx: cur.idx, choice: i })
    const r = await call("answer", { idx: cur.idx, choice: i })
    if (!r) setPicked(null)
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-muted-foreground">
          <span>Question {cur.idx + 1} / {room.qCount}</span>
          <span className={`flex items-center gap-1 ${left < 6 && !reveal ? "text-rose-600" : ""}`}><Timer className="h-4 w-4" /> {reveal ? "Answer" : startsIn > 0 ? "Get ready" : Math.ceil(left) + "s"}</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-black/10"><div className="h-full rounded-full transition-[width] duration-200" style={{ width: reveal || startsIn > 0 ? "100%" : (left / room.sec) * 100 + "%", background: left < 6 ? "#ef4565" : "#7c6fd6" }} /></div>

        <div className="relative rounded-3xl border border-black/5 bg-white p-6 shadow-lg">
          {startsIn > 0 && (
            <div className="absolute inset-0 z-10 grid place-items-center rounded-3xl bg-white/90 backdrop-blur-sm">
              <p className="text-8xl font-black text-primary" style={{ animation: "wr-beat 1s infinite" }}>{Math.ceil(startsIn / 1000)}</p>
            </div>
          )}
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary">{q.topic}</p>
          <p className="mt-2 text-lg font-bold leading-snug text-slate-900">{q.q}</p>
          <div className="mt-5 grid gap-3">
            {q.options.map((o: string, i: number) => {
              const isRight = reveal && cur.correct === i
              const isMineWrong = reveal && myPick === i && cur.correct !== i
              const mine = myPick === i
              return (
                <button key={i} onClick={() => choose(i)} disabled={reveal || myPick !== undefined}
                  className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all ${isRight ? "border-emerald-400 bg-emerald-50" : isMineWrong ? "border-rose-400 bg-rose-50" : mine ? "border-primary bg-primary/10" : reveal ? "border-black/5 opacity-50" : "border-black/10 bg-white hover:-translate-y-0.5 hover:border-primary hover:shadow-md"}`}>
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-sm font-black ${isRight ? "bg-emerald-500 text-white" : isMineWrong ? "bg-rose-500 text-white" : "bg-primary/10 text-primary"}`}>{String.fromCharCode(65 + i)}</span>
                  <span className="text-sm font-semibold text-slate-800">{o}</span>
                  {isRight && <CheckCircle2 className="ml-auto h-5 w-5 text-emerald-600" />}{isMineWrong && <XCircle className="ml-auto h-5 w-5 text-rose-600" />}
                </button>
              )
            })}
          </div>
          {!reveal && myPick !== undefined && <p className="mt-4 text-center text-sm font-bold text-primary">Locked in ✓ waiting for the others…</p>}
          {reveal && (
            <div className="wr-rise mt-4 space-y-2 rounded-2xl bg-slate-50 p-4">
              {cur.explanation && <p className="text-sm text-slate-700"><b>Why:</b> {cur.explanation}</p>}
              <div className="flex flex-wrap gap-2">
                {room.order.map((id: string) => {
                  const pk = cur.picks?.[id]
                  const ok = pk === cur.correct
                  return <span key={id} className={`rounded-full px-3 py-1 text-xs font-extrabold ${pk === undefined ? "bg-slate-200 text-slate-600" : ok ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{room.players[id].name}: {pk === undefined ? "no answer" : ok ? "✓" : "✗"}</span>
                })}
              </div>
            </div>
          )}
        </div>
        {err && <p className="text-center text-sm font-bold text-rose-600">{err}</p>}
      </div>
      <div><p className="mb-2 text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Scoreboard</p><Scoreboard room={room} meUid={user.uid} /></div>
    </div>
  )
}

/* ---------------------------------------------------------------- results */
function Finished({ room, user }: { room: any; user: any }) {
  const ids: string[] = room.order
  const ranked = ids.map((id, i) => ({ id, i, ...room.players[id] })).sort((a, b) => (b.score || 0) - (a.score || 0))
  const myPlace = ranked.findIndex((r) => r.id === user.uid)
  const me = room.players[user.uid]
  const won = myPlace === 0 && ids.length > 1
  return (
    <div className="space-y-5">
      <div className={`rounded-3xl p-8 text-center text-white shadow-xl ${won ? "bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500" : "bg-gradient-to-br from-violet-600 to-fuchsia-500"}`}>
        <Trophy className="mx-auto h-12 w-12" />
        <p className="mt-2 text-xs font-black uppercase tracking-[0.25em] opacity-80">{ids.length > 1 ? (won ? "You won!" : `You finished #${myPlace + 1}`) : "Practice complete"}</p>
        <p className="mt-1 text-6xl font-black">{me?.score || 0}</p>
        <p className="text-sm font-semibold opacity-90">{me?.correct || 0} of {room.qCount} correct · best streak {me?.bestStreak || 0}</p>
      </div>
      <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm"><p className="mb-3 text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Final standings</p><Scoreboard room={room} meUid={user.uid} /></div>
      <div className="rounded-2xl bg-emerald-50 p-4 text-center text-sm font-bold text-emerald-800">XP has been added to your Arena profile and the season leaderboard.</div>
    </div>
  )
}

/* ---------------------------------------------------------------- async challenge */
function AsyncRun({ room, user, code, me, call, err }: any) {
  const now = useClock(250)
  const [fb, setFb] = useState<any>(null)
  const [pick, setPick] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const qi = fb ? fb.idx : me?.idx ?? 0
  const q = room.questions[qi]
  const done = me?.finished && !fb
  const elapsed = me?.qStart ? Math.max(0, (now - me.qStart) / 1000) : 0
  const left = Math.max(0, room.sec - elapsed)

  const choose = async (i: number) => {
    if (fb || busy) return
    setBusy(true); setPick(i)
    const r = await call("answer", { idx: qi, choice: i })
    setBusy(false)
    if (r) setFb({ ...r, idx: qi, choice: i }); else setPick(null)
  }
  const next = () => { setFb(null); setPick(null) }

  const board = room.order.map((id: string, i: number) => ({ id, i, ...room.players[id] })).sort((a: any, b: any) => (b.finished ? b.score : -1) - (a.finished ? a.score : -1))

  if (done) {
    const finishedRows = board.filter((r: any) => r.finished)
    const place = finishedRows.findIndex((r: any) => r.id === user.uid) + 1
    return (
      <div className="space-y-5">
        <div className="rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-500 p-8 text-center text-white shadow-xl">
          <Trophy className="mx-auto h-12 w-12" />
          <p className="mt-2 text-xs font-black uppercase tracking-[0.25em] opacity-80">Challenge complete · rank #{place} of {finishedRows.length}</p>
          <p className="mt-1 text-6xl font-black">{me.score}</p>
          <p className="text-sm font-semibold opacity-90">{me.correct} of {room.qCount} correct · best streak {me.bestStreak}</p>
        </div>
        <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
          <p className="mb-2 text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Dare more friends to beat {me.score}</p>
          <ShareBar code={code} label={`I scored ${me.score} on ${room.source?.label}. Can you beat me?`} />
        </div>
        <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Leaderboard</p>
          <Scoreboard room={{ ...room, order: finishedRows.map((r: any) => r.id) }} meUid={user.uid} />
        </div>
      </div>
    )
  }

  if (!q) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  return (
    <div className="space-y-4">
      {qi === 0 && !fb && (
        <div className="rounded-2xl bg-primary/5 p-4 text-sm font-semibold text-slate-700">
          ⚔️ <b>{room.hostName}</b>'s challenge · {room.source?.label} · {room.qCount} questions. Answer fast: speed adds points.
          <div className="mt-3"><ShareBar code={code} label={`Beat my score on ${room.source?.label}!`} /></div>
        </div>
      )}
      <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-muted-foreground">
        <span>Question {qi + 1} / {room.qCount}</span><span className="text-primary">Score {me?.score || 0}</span>
        <span className="flex items-center gap-1"><Timer className="h-4 w-4" /> {fb ? "" : Math.ceil(left) + "s"}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-black/10"><div className="h-full rounded-full bg-primary transition-[width] duration-200" style={{ width: fb ? "100%" : (left / room.sec) * 100 + "%" }} /></div>
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-lg">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary">{q.topic}</p>
        <p className="mt-2 text-lg font-bold leading-snug text-slate-900">{q.q}</p>
        <div className="mt-5 grid gap-3">
          {q.options.map((o: string, i: number) => {
            const right = fb && fb.correctIndex === i
            const wrong = fb && pick === i && fb.correctIndex !== i
            return (
              <button key={i} onClick={() => choose(i)} disabled={!!fb || busy}
                className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all ${right ? "border-emerald-400 bg-emerald-50" : wrong ? "border-rose-400 bg-rose-50" : pick === i ? "border-primary bg-primary/10" : fb ? "border-black/5 opacity-50" : "border-black/10 bg-white hover:-translate-y-0.5 hover:border-primary hover:shadow-md"}`}>
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-sm font-black ${right ? "bg-emerald-500 text-white" : wrong ? "bg-rose-500 text-white" : "bg-primary/10 text-primary"}`}>{String.fromCharCode(65 + i)}</span>
                <span className="text-sm font-semibold text-slate-800">{o}</span>
              </button>
            )
          })}
        </div>
        {fb && (
          <div className="wr-rise mt-4 space-y-3">
            <div className={`rounded-2xl p-4 text-sm ${fb.correct ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900"}`}>
              <p className="font-black">{fb.correct ? `Correct! +${fb.points}` : "Not quite"}</p>
              {fb.explanation && <p className="mt-1">{fb.explanation}</p>}
            </div>
            <Button onClick={next} className="h-12 w-full rounded-2xl font-black">{fb.finished ? "See my result" : "Next question →"}</Button>
          </div>
        )}
      </div>
      {err && <p className="text-center text-sm font-bold text-rose-600">{err}</p>}
    </div>
  )
}
