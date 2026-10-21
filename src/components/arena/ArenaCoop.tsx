"use client"

import { useMemo, useState } from "react"
import { Loader2, Swords, Star, Crown, Lock, CheckCircle2, AlertTriangle, AlertCircle, XCircle } from "lucide-react"
import { doc } from "firebase/firestore"
import { useDoc, useFirestore } from "@/firebase"
import { Button } from "@/components/ui/button"
import { arena } from "@/lib/arena-client"
import { Avatar, ShareBar } from "@/components/arena/arena-bits"
import { Scene, SETTINGS } from "@/components/cases/ward-scenes"
import { PatientGlyph, BodyMap, VitalsMonitor, StabilityBar, moodOf, liveVitals, ageLabel, type Vitals } from "@/components/cases/ward-ui"

const OUT: Record<string, { icon: any; text: string; ring: string; bg: string; label: string }> = {
  optimal: { icon: CheckCircle2, text: "text-emerald-700", ring: "border-emerald-400", bg: "bg-emerald-50", label: "Excellent team call" },
  acceptable: { icon: AlertCircle, text: "text-amber-700", ring: "border-amber-400", bg: "bg-amber-50", label: "Acceptable" },
  unsafe: { icon: AlertTriangle, text: "text-rose-700", ring: "border-rose-400", bg: "bg-rose-50", label: "Unsafe!" },
  wrong: { icon: XCircle, text: "text-slate-600", ring: "border-slate-300", bg: "bg-slate-50", label: "Not helpful" },
}
const STAGE: Record<string, { emoji: string; label: string; grad: string }> = {
  history: { emoji: "🗣️", label: "History", grad: "from-violet-500 to-fuchsia-500" },
  examination: { emoji: "🩺", label: "Examination", grad: "from-teal-500 to-cyan-500" },
  investigation: { emoji: "🧪", label: "Investigations", grad: "from-amber-500 to-orange-500" },
  diagnosis: { emoji: "🧠", label: "Diagnosis", grad: "from-pink-500 to-rose-500" },
  management: { emoji: "��", label: "Management", grad: "from-emerald-500 to-green-500" },
}
const DEFAULT_VITALS: Vitals = { hr: 96, bp: "118/76", rr: 18, temp: 37.2, spo2: 96 }

export function ArenaCoop({ room, user, code }: { room: any; user: any; code: string }) {
  const db = useFirestore()
  const caseRef = useMemo(() => (!db ? null : doc(db, "cases", room.caseId)), [db, room.caseId])
  const { data: caseData } = useDoc(caseRef)
  const [err, setErr] = useState("")
  const [busy, setBusy] = useState(false)
  const isHost = room.hostUid === user.uid
  const co = room.coop
  const call = async (op: string, extra: any = {}) => {
    setErr(""); setBusy(true)
    try { await arena(user, "coop", { code, op, ...extra }) } catch (e: any) { setErr(e.message) }
    setBusy(false)
  }

  if (room.status === "lobby") {
    return (
      <div className="space-y-5">
        <div className="rounded-3xl bg-gradient-to-br from-rose-500 via-fuchsia-500 to-violet-600 p-6 text-white shadow-xl">
          <p className="text-xs font-black uppercase tracking-widest opacity-80">Ward Round · Co-op</p>
          <h2 className="mt-1 text-2xl font-black">Treat one patient together</h2>
          <p className="mt-1 text-sm opacity-90">Everyone votes on each step. The team's choice decides what happens to the patient. The player leading a step has a vote that counts 1.5×.</p>
        </div>
        <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Invite your team (up to 4)</p>
          <ShareBar code={code} label={`${room.hostName} needs doctors for a Ward Round co-op!`} />
        </div>
        <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Team ({room.order.length}/4)</p>
          <div className="flex flex-wrap gap-3">
            {room.order.map((id: string, i: number) => (
              <div key={id} className="flex items-center gap-2 rounded-2xl border border-black/5 bg-slate-50 py-1.5 pl-1.5 pr-4"><Avatar name={room.players[id].name} i={i} /><span className="text-sm font-extrabold">{room.players[id].name}{id === room.hostUid ? " 👑" : ""}</span></div>
            ))}
          </div>
        </div>
        {isHost ? (
          <Button disabled={busy} onClick={async () => { setBusy(true); try { await arena(user, "start", { code }) } catch (e: any) { setErr(e.message) } setBusy(false) }} className="h-14 w-full rounded-2xl text-base font-black">
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Swords className="mr-2 h-5 w-5" /> Admit the patient</>}
          </Button>
        ) : <p className="rounded-2xl bg-amber-50 p-4 text-center text-sm font-bold text-amber-800">Waiting for {room.hostName} to admit the patient…</p>}
        {err && <p className="text-center text-sm font-bold text-rose-600">{err}</p>}
      </div>
    )
  }

  const c = caseData as any
  if (!c) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  const stages = (c.stages || []).filter((s: any) => s.kind !== 'sequence')
  const stage = stages[Math.min(co.stage, stages.length - 1)]
  const pt = c.patient || {}
  const setting = SETTINGS[c.setting] ? c.setting : "ward"
  const base: Vitals = { ...DEFAULT_VITALS, ...(c.vitals || {}) }
  const treated = room.status === "finished" && !co.final?.arrested && co.history?.[co.history.length - 1]?.outcome === "optimal"
  const vit = liveVitals(base, co.stability, treated)
  const mood = moodOf(c.appearance, co.stability)
  const lead = room.order[co.stage % room.order.length]
  const myVote = co.votes?.[user.uid]
  const voted = Object.keys(co.votes || {}).length
  const letter = (optId: string) => String.fromCharCode(65 + Math.max(0, stage.options.findIndex((o: any) => o.id === optId)))

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_330px]">
        <div className="relative h-[240px] overflow-hidden rounded-3xl border border-black/5 shadow-xl md:h-[310px]">
          <Scene setting={setting}><PatientGlyph scale={1.3} x={430} y={178} name={pt.name} age={pt.age} ageUnit={pt.ageUnit} sex={pt.sex} mood={mood} rr={vit.rr} /></Scene>
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-extrabold text-slate-800 shadow">{SETTINGS[setting].emoji} {SETTINGS[setting].label}</span>
          <div className="absolute right-3 top-3 h-28 w-16 rounded-2xl bg-white/80 p-1 shadow backdrop-blur md:h-32 md:w-[72px]"><BodyMap region={c.region} /></div>
          {pt.name && <div className="absolute bottom-3 left-3 rounded-2xl bg-white/92 px-3 py-2 shadow-lg"><p className="text-sm font-black leading-tight text-slate-900">{pt.name}</p><p className="text-[11px] font-semibold text-slate-600">{ageLabel(pt)} · {pt.sex === "F" ? "Female" : "Male"}{pt.occupation ? " · " + pt.occupation : ""}</p></div>}
          {co.stability <= 0 && <div className="absolute inset-0 grid place-items-center bg-black/55"><p className="text-3xl font-black tracking-widest text-white" style={{ animation: "wr-blink 1s infinite" }}>CODE BLUE</p></div>}
        </div>
        <div className="space-y-3">
          <VitalsMonitor vitals={vit} rhythm={c.rhythm} stability={co.stability} name={pt.name} />
          <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm"><StabilityBar value={co.stability} /></div>
        </div>
      </div>

      {room.status === "finished" ? (
        <div className="space-y-4">
          <div className={`rounded-3xl p-8 text-center text-white shadow-xl ${co.final?.arrested ? "bg-gradient-to-br from-slate-800 to-rose-900" : "bg-gradient-to-br from-violet-600 via-fuchsia-500 to-orange-400"}`}>
            <p className="text-xs font-black uppercase tracking-[0.25em] opacity-80">{co.final?.arrested ? "Code blue, patient lost" : "Team round complete"}</p>
            <p className="mt-2 text-6xl font-black">{co.final?.percent ?? 0}%</p>
            <div className="mt-2 flex justify-center gap-1.5">{[0, 1, 2].map((i) => <Star key={i} className={`h-8 w-8 ${i < (co.final?.stars || 0) ? "fill-yellow-300 text-yellow-300" : "text-white/30"}`} />)}</div>
            <p className="mt-3 text-sm opacity-90">Diagnosis: <span className="font-extrabold">{c.finalDiagnosis}</span></p>
          </div>
          {c.consultantNote && <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm"><p className="mb-1 text-[10px] font-extrabold uppercase tracking-widest text-primary">Consultant debrief</p><p className="text-sm text-slate-800">{c.consultantNote}</p></div>}
          <div className="rounded-2xl bg-emerald-50 p-4 text-center text-sm font-bold text-emerald-800">Team XP has been added for everyone.</div>
        </div>
      ) : stage && (
        <>
          {co.stage === 0 && co.phase === "vote" && (
            <div className="wr-rise flex items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sky-100 text-2xl shadow">👩‍⚕️</div><div className="rounded-2xl rounded-tl-sm border border-black/5 bg-white p-4 shadow-sm"><p className="mb-1 text-[10px] font-extrabold uppercase tracking-widest text-sky-600">Triage nurse</p><p className="text-sm leading-relaxed text-slate-800">{c.stem}</p></div></div>
          )}
          <div key={co.stage + co.phase} className="wr-rise overflow-hidden rounded-3xl border border-black/5 bg-white shadow-lg">
            <div className={`flex items-center justify-between bg-gradient-to-r px-5 py-3 text-white ${(STAGE[stage.type] || STAGE.history).grad}`}>
              <span className="text-xs font-black uppercase tracking-widest">{(STAGE[stage.type] || STAGE.history).emoji} {(STAGE[stage.type] || STAGE.history).label}</span>
              <span className="text-xs font-bold opacity-90">Step {co.stage + 1} of {stages.length}</span>
            </div>
            <div className="space-y-4 p-5">
              <div className="flex flex-wrap items-center gap-2">
                {room.order.map((id: string, i: number) => (
                  <span key={id} className={`flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-3 text-xs font-extrabold ${co.votes?.[id] ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-black/10 bg-slate-50 text-slate-600"}`}>
                    <Avatar name={room.players[id].name} i={i} size={22} />{room.players[id].name.split(" ")[0]}{id === lead ? <Crown className="h-3.5 w-3.5 text-amber-500" /> : null}{co.votes?.[id] ? " ✓" : co.phase === "vote" ? " …" : ""}
                  </span>
                ))}
              </div>
              {co.phase === "vote" && <p className="text-xs font-bold text-amber-700">👑 {room.players[lead]?.name} leads this step. Their vote counts 1.5×.</p>}
              <p className="text-base font-bold leading-snug text-slate-900">{stage.prompt}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {stage.options.map((o: any, i: number) => {
                  const chosen = co.result?.optId === o.id
                  const best = co.phase === "reveal" && co.result?.bestId === o.id && !chosen
                  const st = OUT[o.outcome] || OUT.wrong
                  return (
                    <button key={o.id} disabled={co.phase !== "vote" || busy} onClick={() => call("vote", { optId: o.id })}
                      className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all ${chosen ? `${st.ring} ${st.bg}` : best ? "border-emerald-300 bg-emerald-50/60" : myVote === o.id ? "border-primary bg-primary/10" : co.phase === "reveal" ? "border-black/5 opacity-50" : "border-black/10 bg-white hover:-translate-y-0.5 hover:border-primary hover:shadow-md"}`}>
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-black text-primary">{String.fromCharCode(65 + i)}</span>
                      <span className="pt-1 text-sm font-semibold leading-snug text-slate-800">{o.label}</span>
                    </button>
                  )
                })}
              </div>
              {co.phase === "vote" && (
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm font-bold text-primary">{myVote ? "Vote locked in ✓" : "Cast your vote"} · {voted}/{room.order.length} voted</p>
                  {isHost && voted >= 1 && voted < room.order.length && <Button variant="outline" size="sm" disabled={busy} onClick={() => call("lock")} className="ml-auto gap-1.5 rounded-xl"><Lock className="h-4 w-4" /> Lock in now</Button>}
                </div>
              )}
              {co.phase === "reveal" && co.result && (() => {
                const r = co.result, st = OUT[r.outcome] || OUT.wrong, Icon = st.icon
                return (
                  <div className="wr-rise space-y-3">
                    {r.finding && <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4"><p className="mb-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">What you find</p><p className="text-sm text-slate-800">{r.finding}</p></div>}
                    <div className={`flex items-start gap-3 rounded-2xl border p-4 ${st.ring} ${st.bg}`}><Icon className={`mt-0.5 h-5 w-5 shrink-0 ${st.text}`} /><div><p className={`text-sm font-black ${st.text}`}>{st.label} ({r.points > 0 ? "+" : ""}{r.points} pts)</p><p className="mt-0.5 text-sm text-slate-700">{r.feedback}</p></div></div>
                    {r.bestId !== r.optId && <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4"><p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700">💡 The best move was</p><p className="mt-1 text-sm font-bold text-slate-800">{r.bestLabel}</p><p className="mt-0.5 text-sm text-slate-600">{r.bestFeedback}</p></div>}
                    <div className="flex flex-wrap gap-2">{room.order.map((id: string) => <span key={id} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-700">{room.players[id].name.split(" ")[0]}: {r.votes?.[id] ? letter(r.votes[id]) : "–"}</span>)}</div>
                    <Button disabled={busy} onClick={() => call("next")} className="h-12 w-full rounded-2xl text-base font-bold">{co.stability <= 0 ? "The patient has arrested… continue" : co.stage + 1 < stages.length ? "Next step →" : "Finish the round"}</Button>
                  </div>
                )
              })()}
            </div>
          </div>
        </>
      )}
      {err && <p className="text-center text-sm font-bold text-rose-600">{err}</p>}
    </div>
  )
}
